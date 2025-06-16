// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Vm } from "forge-std/Vm.sol";

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { Test } from "forge-std/Test.sol";
import { IPFSFunctionsConsumerMock } from "test/mocks/IPFSFunctionsConsumerMock.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";
import { Deploy } from "script/Deploy.s.sol";
import { AaveYieldManager } from "src/yield/AaveYieldManager.sol";

contract UntilThenV1Test is Test {
    UntilThenV1 internal untilThenV1;
    GiftNFT internal giftNFT;
    AaveYieldManager internal aaveYieldManager;
    address internal OWNER = makeAddr("OWNER");
    address internal USER_SENDER = makeAddr("USER_SENDER");
    address internal USER_RECEIVER = makeAddr("USER_RECEIVER");
    uint256 constant INITIAL_BALANCE = 10 ether;
    uint256 constant CURRENCY_GIFT_AMOUNT = 2 ether;
    string constant CONTENT_PUBLIC_HASH = "PUBLIC_QmcYQrkV9zjYW3jopExb4Qufkm8t94EtSHcUqdLXymEwPP";
    string constant CONTENT_PRIVATE_HASH = "PRIVATE_QmcYQrkV9zjYW3jopExb4Qufkm8t94EtSHcUqdLXymEwPP";
    uint256 internal contentGiftFee;
    uint256 internal currencyGiftFee;
    uint256 internal currencyGiftLinkFee;
    uint256 internal releaseTimestamp = block.timestamp + 2 weeks;
    IPFSFunctionsConsumerMock consumer;
    address internal linkTokenAddress;
    address internal wethGatewayAddress;

    event GiftCreated(address indexed sender, address indexed receiver, uint256 giftId);
    event GiftClaimed(
        address indexed receiver, uint256 indexed giftId, uint256 giftAmountToClaim, uint256 nftId, bytes32 requestId
    );

    function setUp() public {
        Deploy deployer = new Deploy();
        HelperConfig helperConfig;
        (untilThenV1, giftNFT, helperConfig, aaveYieldManager) = deployer.run();
        (
            HelperConfig.ChainlinkFunctionsConfig memory chainlinkFunctionsConfig,
            ,
            uint256 _contentGiftFee,
            uint256 _currencyGiftFee,
            uint256 _currencyGiftLinkFee,
            HelperConfig.AaveYieldConfig memory aaveYieldConfig,
        ) = helperConfig.activeNetworkConfig();
        contentGiftFee = _contentGiftFee;
        currencyGiftFee = _currencyGiftFee;
        currencyGiftLinkFee = _currencyGiftLinkFee;
        linkTokenAddress = aaveYieldConfig.linkAddress;
        wethGatewayAddress = aaveYieldConfig.wethGatewayAddress;
        consumer = IPFSFunctionsConsumerMock(chainlinkFunctionsConfig.consumerAddress);

        vm.prank(0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24); // account with LINK balance
        IERC20(linkTokenAddress).transfer(USER_SENDER, CURRENCY_GIFT_AMOUNT);

        vm.prank(USER_SENDER);
        IERC20(linkTokenAddress).approve(address(aaveYieldManager), CURRENCY_GIFT_AMOUNT);

        deal(USER_SENDER, INITIAL_BALANCE);
    }

    function _createGift(bool yield, uint256 linkAmount) private returns (uint256 giftId, uint256 amount) {
        if (yield) {
            amount = contentGiftFee + CURRENCY_GIFT_AMOUNT;
            if (linkAmount > 0) {
                amount = contentGiftFee;
            }
        } else {
            amount = contentGiftFee + currencyGiftFee + CURRENCY_GIFT_AMOUNT;
        }
        vm.prank(USER_SENDER);
        giftId = untilThenV1.createGift{ value: amount }(
            USER_RECEIVER, releaseTimestamp, CONTENT_PUBLIC_HASH, yield, linkAmount
        );
    }

    function _claimGift(uint256 giftId) private returns (uint256 nftId) {
        vm.warp(releaseTimestamp);
        vm.prank(USER_RECEIVER);
        nftId = untilThenV1.claimGift(giftId);
    }

    // createGift
    function test_createGiftWithETH() public {
        vm.expectEmit(true, true, false, true);
        emit GiftCreated(USER_SENDER, USER_RECEIVER, 1);
        (uint256 giftId, uint256 amount) = _createGift({ yield: false, linkAmount: 0 });

        vm.assertEq(untilThenV1.getTotalGifts(), 1);
        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.id, giftId);
        vm.assertEq(uint256(gift.status), uint256(UntilThenV1.GiftStatus.PENDING));
        vm.assertEq(gift.sender, USER_SENDER);
        vm.assertEq(gift.receiver, USER_RECEIVER);
        vm.assertEq(gift.amount, CURRENCY_GIFT_AMOUNT);
        vm.assertEq(gift.releaseTimestamp, releaseTimestamp);
        vm.assertEq(gift.contentHash, CONTENT_PUBLIC_HASH);
        vm.assertEq(gift.isYield, false);
        vm.assertEq(gift.linkYield, false);
        vm.assertEq(gift.nftClaimedId, 0);

        vm.assertEq(address(untilThenV1).balance, amount);
        vm.assertEq(untilThenV1.getSenderGifts(USER_SENDER)[0].id, giftId);
        vm.assertEq(untilThenV1.getReceiverGifts(USER_RECEIVER)[0].id, giftId);
    }

    function test_createGiftWithETHYield() public {
        (uint256 giftId,) = _createGift({ yield: true, linkAmount: 0 });

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.isYield, true);
        vm.assertEq(gift.linkYield, false);
        vm.assertEq(gift.amount, CURRENCY_GIFT_AMOUNT);
    }

    function test_createGiftWithLinkYield() public {
        (uint256 giftId,) = _createGift({ yield: true, linkAmount: CURRENCY_GIFT_AMOUNT });

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.amount, CURRENCY_GIFT_AMOUNT);
        vm.assertEq(gift.isYield, true);
        vm.assertEq(gift.linkYield, true);
    }

    function test_createGiftWithNoContent() public {
        uint256 amount = contentGiftFee + currencyGiftFee + CURRENCY_GIFT_AMOUNT;
        vm.prank(USER_SENDER);
        uint256 giftId = untilThenV1.createGift{ value: amount }(USER_RECEIVER, releaseTimestamp, hex"", false, 0);

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(gift.amount, contentGiftFee + CURRENCY_GIFT_AMOUNT);
    }

    function test_createGiftRevertsWithInvalidPArams() public {
        vm.startPrank(USER_SENDER);
        vm.expectRevert(UntilThenV1.UntilThenV1__ReceiverCannotBeZeroAddress.selector);
        untilThenV1.createGift{ value: currencyGiftFee }(address(0), releaseTimestamp, hex"", false, 0);

        vm.expectRevert(UntilThenV1.UntilThenV1__InvalidGiftFee.selector);
        untilThenV1.createGift{ value: 0 }(USER_RECEIVER, releaseTimestamp, hex"", false, 0);
    }

    // claimGift
    function test_claimGiftWithETH() public {
        (uint256 giftId,) = _createGift({ yield: false, linkAmount: 0 });
        uint256 receiverInitialbalance = USER_RECEIVER.balance;

        vm.warp(block.timestamp + 2 weeks);
        vm.prank(USER_RECEIVER);
        uint256 nftId = untilThenV1.claimGift(giftId);

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        vm.assertEq(uint256(gift.status), uint256(UntilThenV1.GiftStatus.CLAIMED));
        vm.assertEq(gift.nftClaimedId, nftId);
        vm.assertEq(giftNFT.ownerOf(nftId), USER_RECEIVER);
        vm.assertEq(USER_RECEIVER.balance, receiverInitialbalance + CURRENCY_GIFT_AMOUNT);
    }

    function test_claimGiftWithETHYield() public {
        (uint256 giftId,) = _createGift({ yield: true, linkAmount: 0 });
        uint256 receiverInitialbalance = USER_RECEIVER.balance;

        vm.warp(block.timestamp + 2 weeks);
        vm.prank(USER_RECEIVER);
        untilThenV1.claimGift(giftId);

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        // Yield was zero so uses currencyGiftFee
        vm.assertEq(USER_RECEIVER.balance, receiverInitialbalance + gift.amount - currencyGiftFee);
        vm.assertEq(address(aaveYieldManager).balance, currencyGiftFee);
    }

    function test_claimGiftWithLinkYield() public {
        (uint256 giftId,) = _createGift({ yield: true, linkAmount: CURRENCY_GIFT_AMOUNT });
        uint256 receiverInitialbalance = USER_RECEIVER.balance;
        uint256 receiverLinkInitialbalance = IERC20(linkTokenAddress).balanceOf(USER_RECEIVER);

        vm.warp(block.timestamp + 2 weeks);
        vm.prank(USER_RECEIVER);
        untilThenV1.claimGift(giftId);

        UntilThenV1.Gift memory gift = untilThenV1.getGiftById(giftId);
        // Yield was zero so uses currencyGiftLinkFee
        vm.assertEq(
            IERC20(linkTokenAddress).balanceOf(USER_RECEIVER),
            receiverLinkInitialbalance + gift.amount - currencyGiftLinkFee
        );
        vm.assertEq(USER_RECEIVER.balance, receiverInitialbalance);
        vm.assertGt(IERC20(linkTokenAddress).balanceOf(address(aaveYieldManager)), 0);
    }

    function test_claimGiftRevertsWithInvalidParams() public {
        (uint256 giftId,) = _createGift({ yield: false, linkAmount: 0 });

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
