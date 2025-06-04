// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { Test } from "forge-std/Test.sol";

contract UntilThenV1Test is Test {
    UntilThenV1 internal untilThenV1;
    address internal OWNER = makeAddr("OWNER");
    address internal USER_SENDER = makeAddr("USER_SENDER");
    address internal USER_RECEIVER = makeAddr("USER_RECEIVER");
    uint256 constant CONTENT_GIFT_FEE = 0.01 ether;
    uint256 constant CURRENCY_GIFT_FEE = 0.0001 ether;
    uint256 constant INITIAL_BALANCE = 10 ether;
    uint256 constant CURRENCY_GIFT_AMOUNT = 2 ether;

    event GiftCreated(address indexed sender, address indexed receiver, uint256 giftId);

    function setUp() public {
        vm.prank(OWNER);
        untilThenV1 = new UntilThenV1(CONTENT_GIFT_FEE, CURRENCY_GIFT_FEE);

        vm.deal(USER_SENDER, INITIAL_BALANCE);
    }

    // createGift
    function test_createGift() public {
        uint256 amount = CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        vm.expectEmit(true, true, false, true);
        emit GiftCreated(USER_SENDER, USER_RECEIVER, 1);
        uint256 giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER,
            block.timestamp + 1 days,
            abi.encodePacked("letter"),
            UntilThenV1.AvailableYieldStrategies.NONE
        );

        vm.assertEq(untilThenV1.getTotalGifts(), 1);
        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.id, giftId);
        vm.assertEq(uint256(gift.status), uint256(UntilThenV1.GiftStatus.PENDING));
        vm.assertEq(gift.sender, USER_SENDER);
        vm.assertEq(gift.receiver, USER_RECEIVER);
        vm.assertEq(gift.amount, CURRENCY_GIFT_AMOUNT);
        vm.assertEq(gift.releaseTimestamp, block.timestamp + 1 days);
        vm.assertEq(gift.contentHash, abi.encodePacked("letter"));
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
            USER_RECEIVER,
            block.timestamp + 1 days,
            abi.encodePacked("letter"),
            UntilThenV1.AvailableYieldStrategies.AAVE
        );

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.amount, CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT);
        vm.assertEq(uint256(gift.yieldStrategy.strategy), uint256(UntilThenV1.AvailableYieldStrategies.AAVE));
    }

    function test_createGiftWithNoContent() public {
        uint256 amount = CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        uint256 giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER, block.timestamp + 1 days, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.amount, CONTENT_GIFT_FEE + CURRENCY_GIFT_FEE + CURRENCY_GIFT_AMOUNT);
        vm.assertEq(uint256(gift.yieldStrategy.strategy), uint256(UntilThenV1.AvailableYieldStrategies.COMPOUND));
    }

    function test_createGiftRevertsWithInvalidPArams() public {
        vm.startPrank(USER_SENDER);
        vm.expectRevert(UntilThenV1.UntilThenV1__ReceiverCannotBeZeroAddress.selector);
        untilThenV1.createGift{ value: CURRENCY_GIFT_FEE }(
            address(0), block.timestamp + 1 days, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );

        vm.warp(block.timestamp + 10 days);
        vm.expectRevert(UntilThenV1.UntilThenV1__ReleaseTimestampCannotBeInThePast.selector);
        untilThenV1.createGift{ value: CURRENCY_GIFT_FEE }(
            USER_RECEIVER, block.timestamp - 1 days, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );

        vm.expectRevert(UntilThenV1.UntilThenV1__InvalidGiftFee.selector);
        untilThenV1.createGift{ value: 0 }(
            USER_RECEIVER, block.timestamp + 1 days, hex"", UntilThenV1.AvailableYieldStrategies.COMPOUND
        );
    }
}
