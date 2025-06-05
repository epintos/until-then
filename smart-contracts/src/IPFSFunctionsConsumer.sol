// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { FunctionsClient } from "@chainlink/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { FunctionsRequest } from "@chainlink/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

import { GiftNFT } from "src/GiftNFT.sol";

contract GettingStartedFunctionsConsumer is FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    error GettingStartedFunctionsConsumer__UnexpectedRequestID(bytes32 requestId);

    struct FunctionRequest {
        uint256 nftId;
        string publicContentHash; // The public content hash of the character
        bytes error;
    }

    event GiftContentHashUpdated(bytes32 indexed requestId, string publicContentHash, bytes err);

    // Router address - Hardcoded for Sepolia
    // Check to get the router address for your supported network
    // https://docs.chain.link/chainlink-functions/supported-networks
    address router = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    string source = "const characterId = args[0];" "const apiResponse = await Functions.makeHttpRequest({"
        "url: `https://swapi.info/api/people/${characterId}/`" "});" "if (apiResponse.error) {"
        "throw Error('Request failed');" "}" "const { data } = apiResponse;" "return Functions.encodeString(data.name);"; // TODO

    //Callback gas limit
    uint32 gasLimit = 300_000;

    // donID - Hardcoded for Sepolia
    // Check to get the donID for your supported network https://docs.chain.link/chainlink-functions/supported-networks
    bytes32 donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    // State variable to store the returned character information
    uint64 public subscriptionId;
    GiftNFT internal giftNFTContract;
    mapping(bytes32 requestId => FunctionRequest request) public requests;

    constructor(
        address untilThenContract,
        uint64 _subscriptionId,
        address _giftNFTContract
    )
        FunctionsClient(router)
        Ownable(untilThenContract)
    {
        subscriptionId = _subscriptionId;
        giftNFTContract = GiftNFT(_giftNFTContract);
    }

    function sendRequest(uint256 nftId, string[] calldata args) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
        requests[requestId] = FunctionRequest({ nftId: nftId, publicContentHash: hex"", error: hex"" });
        return requestId;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        FunctionRequest storage request = requests[requestId];
        if (request.nftId == 0) {
            revert GettingStartedFunctionsConsumer__UnexpectedRequestID(requestId);
        }
        if (err.length > 0) {
            request.error = err;
        }
        request.publicContentHash = string(response);
        giftNFTContract.updateContentHash(request.nftId, bytes(response));

        emit GiftContentHashUpdated(requestId, string(response), err);
    }
}
