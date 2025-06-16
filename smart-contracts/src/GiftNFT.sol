//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract GiftNFT is ERC721, AccessControl, Ownable {
    /// ERRORS
    error GiftNFT__ReceiverCannotBeZeroAddress();
    error GiftNFT__InvalidGiftId();

    struct Metadata {
        uint256 giftId;
        string contentHash;
    }

    bytes32 public constant MINT_AND_BURN_ROLE = keccak256("MINT_AND_BURN_ROLE");
    bytes32 public constant UPDATE_CONTENT_ROLE = keccak256("UPDATE_CONTENT_ROLE");

    uint256 public totalSupply;
    string public uriImageUrl = "ipfs://bafybeidzsag473kzccyzycydv3h5yrdflphsfl3ojlckur4pzvpupij3p4";
    string public uriName = "UntilThen Gift";
    string public uriDescription = "A gift from the past";

    mapping(uint256 tokenId => Metadata metadata) private tokenMetadata;

    event ContentHashUpdated(uint256 indexed tokenId, string publicContentHash);
    event DataUpdated(string newUriName, string newUriDescription, string newUriImageUrl);

    constructor() Ownable(msg.sender) ERC721("UntilThenGift", "UNTIL") { }

    function updateNFTData(
        string calldata newUriName,
        string calldata newUriDescription,
        string calldata newUriImageUrl
    )
        external
        onlyOwner
    {
        uriName = newUriName;
        uriDescription = newUriDescription;
        uriImageUrl = newUriImageUrl;
        emit DataUpdated(newUriName, newUriDescription, newUriImageUrl);
    }

    function grantMintAndBurnRole(address account) external onlyOwner {
        _grantRole(MINT_AND_BURN_ROLE, account);
    }

    function grantUpdateContentRole(address account) external onlyOwner {
        _grantRole(UPDATE_CONTENT_ROLE, account);
    }

    function mint(address to, uint256 giftId) external onlyRole(MINT_AND_BURN_ROLE) returns (uint256 tokenId) {
        if (to == address(0)) {
            revert GiftNFT__ReceiverCannotBeZeroAddress();
        }

        if (giftId == 0) {
            revert GiftNFT__InvalidGiftId();
        }
        tokenId = ++totalSupply;
        tokenMetadata[tokenId] = Metadata({ giftId: giftId, contentHash: hex"" });
        _mint(to, tokenId);
    }

    function updateContentHash(
        uint256 tokenId,
        string calldata publicContentHash
    )
        external
        onlyRole(UPDATE_CONTENT_ROLE)
    {
        _ownerOf(tokenId);
        tokenMetadata[tokenId].contentHash = publicContentHash;
        emit ContentHashUpdated(tokenId, publicContentHash);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getMetadata(uint256 tokenId) external view returns (Metadata memory) {
        _ownerOf(tokenId);
        return tokenMetadata[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _ownerOf(tokenId);
        Metadata memory metadata = tokenMetadata[tokenId];
        return string(
            abi.encodePacked(
                '{"name":"',
                uriName,
                '", "description":"',
                uriDescription,
                '", "image":"',
                uriImageUrl,
                '", "attributes":[',
                '{"trait_type":"giftId","value":"',
                Strings.toString(metadata.giftId),
                '"},',
                '{"trait_type":"contentHash","value":"',
                metadata.contentHash,
                '"}',
                "]}"
            )
        );
    }
}
