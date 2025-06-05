// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { Test } from "forge-std/Test.sol";
import { IPFSFunctionsConsumerMock } from "test/mocks/IPFSFunctionsConsumerMock.sol";

contract UntilThenV1Test is Test {
    UntilThenV1 internal untilThenV1;
    GiftNFT internal giftNFT;
    address internal OWNER = makeAddr("OWNER");
    address internal USER_SENDER = makeAddr("USER_SENDER");
    address internal USER_RECEIVER = makeAddr("USER_RECEIVER");
    uint256 constant CONTENT_GIFT_FEE = 0.01 ether;
    uint256 constant CURRENCY_GIFT_FEE = 0.0001 ether;
    uint256 constant INITIAL_BALANCE = 10 ether;
    uint256 constant CURRENCY_GIFT_AMOUNT = 2 ether;
    string constant CONTENT_HASH = "PUBLIC_QmcYQrkV9zjYW3jopExb4Qufkm8t94EtSHcUqdLXymEwPP";
    string constant CONTENT_PRIVATE_HASH = "PRIVATE_QmcYQrkV9zjYW3jopExb4Qufkm8t94EtSHcUqdLXymEwPP";
    uint256 internal releaseTimestamp = block.timestamp + 2 weeks;
    IPFSFunctionsConsumerMock consumer;

    event GiftCreated(address indexed sender, address indexed receiver, uint256 giftId);
    event GiftClaimed(
        address indexed receiver, uint256 indexed giftId, uint256 giftAmountToClaim, uint256 nftId, bytes32 requestId
    );

    function setUp() public {
        vm.startPrank(OWNER);
        giftNFT = new GiftNFT();
        consumer = new IPFSFunctionsConsumerMock(0, address(giftNFT));
        untilThenV1 = new UntilThenV1(CONTENT_GIFT_FEE, CURRENCY_GIFT_FEE, address(giftNFT), address(consumer));
        giftNFT.grantMintAndBurnRole(address(untilThenV1));
        giftNFT.transferOwnership(address(untilThenV1));
        // consumer.transferOwnership(address(untilThenV1));
        vm.stopPrank();

        vm.deal(USER_SENDER, INITIAL_BALANCE);
    }

    function _createGift() private returns (uint256 giftId) {
        uint256 amount = CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER, releaseTimestamp, CONTENT_HASH, UntilThenV1.AvailableYieldStrategies.NONE
        );
    }

    function _claimGift(uint256 giftId) private returns (uint256 nftId) {
        vm.warp(releaseTimestamp);
        vm.prank(USER_RECEIVER);
        nftId = untilThenV1.claimGift(giftId);
    }

    // createGift
    function test_createGift() public {
        uint256 amount = CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        vm.expectEmit(true, true, false, true);
        emit GiftCreated(USER_SENDER, USER_RECEIVER, 1);
        uint256 giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER, releaseTimestamp, CONTENT_HASH, UntilThenV1.AvailableYieldStrategies.NONE
        );

        vm.assertEq(untilThenV1.getTotalGifts(), 1);
        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.id, giftId);
        vm.assertEq(uint256(gift.status), uint256(UntilThenV1.GiftStatus.PENDING));
        vm.assertEq(gift.sender, USER_SENDER);
        vm.assertEq(gift.receiver, USER_RECEIVER);
        vm.assertEq(gift.amount, CURRENCY_GIFT_AMOUNT);
        vm.assertEq(gift.releaseTimestamp, releaseTimestamp);
        vm.assertEq(gift.contentHash, CONTENT_HASH);
        vm.assertEq(uint256(gift.yieldStrategy.strategy), uint256(UntilThenV1.AvailableYieldStrategies.NONE));
        vm.assertEq(gift.yieldStrategy.yieldToken, address(0));
        vm.assertEq(gift.nftClaimedId, 0);

        vm.assertEq(address(untilThenV1).balance, amount);
        vm.assertEq(untilThenV1.getSenderGifts(USER_SENDER)[0].id, giftId);
        vm.assertEq(untilThenV1.getReceiverGifts(USER_RECEIVER)[0].id, giftId);
    }

    function test_createGiftWithYield() public {
        uint256 amount = CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        uint256 giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER, releaseTimestamp, CONTENT_HASH, UntilThenV1.AvailableYieldStrategies.AAVE
        );

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.amount, CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT);
        vm.assertEq(uint256(gift.yieldStrategy.strategy), uint256(UntilThenV1.AvailableYieldStrategies.AAVE));
    }

    function test_createGiftWithNoContent() public {
        uint256 amount = CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        uint256 giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER, releaseTimestamp, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.amount, CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT);
        vm.assertEq(uint256(gift.yieldStrategy.strategy), uint256(UntilThenV1.AvailableYieldStrategies.COMPOUND));
    }

    function test_createGiftRevertsWithInvalidPArams() public {
        vm.startPrank(USER_SENDER);
        vm.expectRevert(UntilThenV1.UntilThenV1__ReceiverCannotBeZeroAddress.selector);
        untilThenV1.createGift{ value: CURRENCY_GIFT_FEE }(
            address(0), releaseTimestamp, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );

        vm.warp(block.timestamp + 10 days);
        vm.expectRevert(UntilThenV1.UntilThenV1__ReleaseTimestampCannotBeInThePast.selector);
        untilThenV1.createGift{ value: CURRENCY_GIFT_FEE }(
            USER_RECEIVER, block.timestamp - 1 days, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );

        vm.expectRevert(UntilThenV1.UntilThenV1__InvalidGiftFee.selector);
        untilThenV1.createGift{ value: 0 }(
            USER_RECEIVER, releaseTimestamp, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );
    }

    // claimGift
    function test_claimGift() public {
        uint256 giftId = _createGift();
        uint256 receiverInitialbalance = USER_RECEIVER.balance;

        vm.warp(block.timestamp + 2 weeks);
        vm.prank(USER_RECEIVER);
        vm.expectEmit(true, true, false, true);
        emit GiftClaimed(USER_RECEIVER, giftId, CURRENCY_GIFT_AMOUNT, 1, 0);
        uint256 nftId = untilThenV1.claimGift(giftId);

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(uint256(gift.status), uint256(UntilThenV1.GiftStatus.CLAIMED));
        vm.assertEq(gift.nftClaimedId, nftId);
        vm.assertEq(giftNFT.ownerOf(nftId), USER_RECEIVER);
        vm.assertEq(USER_RECEIVER.balance, receiverInitialbalance + CURRENCY_GIFT_AMOUNT);
    }

    function test_claimGiftRevertsWithInvalidParams() public {
        uint256 giftId = _createGift();

        vm.prank(USER_RECEIVER);
        vm.expectRevert(UntilThenV1.UntilThenV1__GiftCannotBeClaimedYet.selector);
        untilThenV1.claimGift(giftId);

        vm.warp(block.timestamp + 2 weeks);
        vm.prank(USER_RECEIVER);
        vm.expectRevert(UntilThenV1.UntilThenV1__GiftDoesNotExist.selector);
        untilThenV1.claimGift(2);

        vm.prank(address(this));
        vm.expectRevert(UntilThenV1.UntilThenV1__NotAuthorizedToClaimGift.selector);
        untilThenV1.claimGift(giftId);

        _claimGift(giftId);
        vm.prank(USER_RECEIVER);
        vm.expectRevert(UntilThenV1.UntilThenV1__GiftHasBeenClaimedAlready.selector);
        untilThenV1.claimGift(giftId);
    }
}
