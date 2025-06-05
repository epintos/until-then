// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { GiftNFT } from "src/GiftNFT.sol";

contract IPFSFunctionsConsumerMock {
    uint64 public subscriptionId;
    GiftNFT internal giftNFTContract;

    constructor(uint64 _subscriptionId, address _giftNFTContract) {
        subscriptionId = _subscriptionId;
        giftNFTContract = GiftNFT(_giftNFTContract);
    }

    function sendRequest(uint256, /*nftId*/ string[] calldata /*args*/ ) external pure returns (bytes32 requestId) {
        return 0;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external { }
}
