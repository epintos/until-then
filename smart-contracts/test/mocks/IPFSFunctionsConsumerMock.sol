// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { GiftNFT } from "src/GiftNFT.sol";

contract IPFSFunctionsConsumerMock is Ownable, AccessControl {
    GiftNFT internal giftNFTContract;
    bytes32 public constant SEND_REQUEST_ROLE = keccak256("SEND_REQUEST_ROLE");

    constructor() Ownable(msg.sender) { }

    function setGiftNFTContract(address _giftNFTContract) external onlyOwner {
        giftNFTContract = GiftNFT(_giftNFTContract);
    }

    function sendRequest(uint256, /*nftId*/ string[] calldata /*args*/ ) external pure returns (bytes32 requestId) {
        return 0;
    }

    function grantSendRequestRole(address account) external onlyOwner {
        _grantRole(SEND_REQUEST_ROLE, account);
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external { }
}
