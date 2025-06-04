// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { Test } from "forge-std/Test.sol";

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
        giftNFT = new GiftNFT(OWNER);
        untilThenV1 = new UntilThenV1(CONTENT_GIFT_FEE, CURRENCY_GIFT_FEE, address(giftNFT));
        giftNFT.transferOwnership(address(untilThenV1));
        vm.stopPrank();
    }

    // mint
    function test_mint() public {
        uint256 giftId = 1;
        bytes memory contentHash = abi.encodePacked(CONTENT_GIFT);

        vm.prank(address(untilThenV1));
        uint256 tokenId = giftNFT.mint(USER, giftId, contentHash);

        assertEq(giftNFT.ownerOf(tokenId), USER);

        GiftNFT.Metadata memory metadata = giftNFT.getMetadata(tokenId);
        assertEq(metadata.giftId, giftId);
        assertEq(metadata.contentHash, contentHash);
    }
}
