// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { Test } from "forge-std/Test.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";

contract GiftNFTTest is Test {
    UntilThenV1 internal untilThenV1;
    GiftNFT internal giftNFT;
    address internal OWNER = makeAddr("OWNER");
    address internal USER = makeAddr("USER");
    uint256 constant CONTENT_GIFT_FEE = 0.01 ether;
    uint256 constant CURRENCY_GIFT_FEE = 0.0001 ether;
    string constant CONTENT_GIFT = "This is a gift letter";

    function setUp() public {
        vm.startPrank(OWNER);
        giftNFT = new GiftNFT();
        IPFSFunctionsConsumer consumer = new IPFSFunctionsConsumer(0, address(giftNFT));
        untilThenV1 = new UntilThenV1(CONTENT_GIFT_FEE, CURRENCY_GIFT_FEE, address(giftNFT), address(consumer));
        giftNFT.grantUpdateContentRole(address(consumer));
        giftNFT.grantMintAndBurnRole(address(untilThenV1));
        giftNFT.transferOwnership(address(untilThenV1));
        consumer.transferOwnership(address(untilThenV1));
        vm.stopPrank();
    }

    // mint
    function test_mint() public {
        uint256 giftId = 1;

        vm.prank(address(untilThenV1));
        uint256 tokenId = giftNFT.mint(USER, giftId);

        assertEq(giftNFT.ownerOf(tokenId), USER);

        GiftNFT.Metadata memory metadata = giftNFT.getMetadata(tokenId);
        assertEq(metadata.giftId, giftId);
        assertEq(metadata.contentHash, hex"");
    }
}
