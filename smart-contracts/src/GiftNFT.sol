//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract GiftNFT is Ownable, ERC721 {
    /// ERRORS
    error GiftNFT__ReceiverCannotBeZeroAddress();
    error GiftNFT__InvalidGiftId();

    uint256 internal totalSupply;
    mapping(uint256 tokenId => Metadata metadata) private tokenMetadata;

    struct Metadata {
        uint256 giftId;
        bytes contentHash;
    }

    constructor(address untilThenContract) Ownable(untilThenContract) ERC721("UntilThenGift", "UNTIL") { }

    function mint(
        address to,
        uint256 giftId,
        bytes calldata contentHash
    )
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        if (to == address(0)) {
            revert GiftNFT__ReceiverCannotBeZeroAddress();
        }

        if (giftId == 0) {
            revert GiftNFT__InvalidGiftId();
        }
        tokenId = ++totalSupply;
        tokenMetadata[tokenId] = Metadata({ giftId: giftId, contentHash: contentHash });
        _mint(to, tokenId);
    }

    function getMetadata(uint256 tokenId) external view returns (Metadata memory) {
        _ownerOf(tokenId);
        return tokenMetadata[tokenId];
    }
}
