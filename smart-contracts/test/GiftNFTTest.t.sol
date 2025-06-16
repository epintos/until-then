// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { Test } from "forge-std/Test.sol";
import { IPFSFunctionsConsumerMock } from "test/mocks/IPFSFunctionsConsumerMock.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";
import { Deploy } from "script/Deploy.s.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract GiftNFTTest is Test {
    UntilThenV1 internal untilThenV1;
    GiftNFT internal giftNFT;
    address internal OWNER = makeAddr("OWNER");
    address internal USER = makeAddr("USER");
    string constant CONTENT_PUBLIC_HASH = "PUBLIC_QmcYQrkV9zjYW3jopExb4Qufkm8t94EtSHcUqdLXymEwPP";
    uint256 constant GIFT_ID = 1;
    IPFSFunctionsConsumerMock consumer;

    event ContentHashUpdated(uint256 indexed tokenId, string publicContentHash);

    function setUp() public {
        Deploy deployer = new Deploy();
        HelperConfig helperConfig;
        (untilThenV1, giftNFT, helperConfig,) = deployer.run();
        (, address account,,,,,,) = helperConfig.activeNetworkConfig();
        consumer = IPFSFunctionsConsumerMock(address(untilThenV1.getIPFSConsumer()));

        vm.prank(address(account));
        untilThenV1.transferOwnership(OWNER);
    }

    // mint
    function test_mint() public {
        vm.prank(address(untilThenV1));
        uint256 tokenId = giftNFT.mint(USER, GIFT_ID);

        assertEq(giftNFT.ownerOf(tokenId), USER);

        GiftNFT.Metadata memory metadata = giftNFT.getMetadata(tokenId);
        assertEq(metadata.giftId, GIFT_ID);
        assertEq(metadata.contentHash, hex"");
    }

    // updateContentHash
    function test_updateContentHash() public {
        vm.prank(address(untilThenV1));
        uint256 tokenId = giftNFT.mint(USER, GIFT_ID);

        vm.prank(address(consumer));
        vm.expectEmit(true, false, false, true);
        emit ContentHashUpdated(tokenId, CONTENT_PUBLIC_HASH);
        giftNFT.updateContentHash(tokenId, CONTENT_PUBLIC_HASH);

        GiftNFT.Metadata memory metadata = giftNFT.getMetadata(tokenId);
        assertEq(metadata.contentHash, CONTENT_PUBLIC_HASH);
    }
    // tokenURI

    function test_tokenURI() public {
        vm.prank(address(untilThenV1));
        uint256 tokenId = giftNFT.mint(USER, GIFT_ID);

        vm.prank(address(consumer));
        giftNFT.updateContentHash(tokenId, CONTENT_PUBLIC_HASH);

        string memory expectedURI = string(
            abi.encodePacked(
                '{"name":"',
                giftNFT.uriName(),
                '", "description":"',
                giftNFT.uriDescription(),
                '", "image":"',
                giftNFT.uriImageUrl(),
                '", "attributes":[',
                '{"trait_type":"giftId","value":"',
                Strings.toString(GIFT_ID),
                '"},',
                '{"trait_type":"contentHash","value":"',
                CONTENT_PUBLIC_HASH,
                '"}',
                "]}"
            )
        );

        assertEq(giftNFT.tokenURI(tokenId), expectedURI);
    }
}
