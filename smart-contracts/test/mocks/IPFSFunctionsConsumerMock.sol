// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { GiftNFT } from "src/GiftNFT.sol";

contract IPFSFunctionsConsumerMock is Ownable {
    GiftNFT internal giftNFTContract;

    constructor(address _giftNFTContract) Ownable(msg.sender) {
        giftNFTContract = GiftNFT(_giftNFTContract);
    }

    function sendRequest(uint256, /*nftId*/ string[] calldata /*args*/ ) external pure returns (bytes32 requestId) {
        return 0;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external { }
}
