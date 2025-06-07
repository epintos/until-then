// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { FunctionsClient } from "@chainlink/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { FunctionsRequest } from "@chainlink/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { GiftNFT } from "src/GiftNFT.sol";

contract IPFSFunctionsConsumer is FunctionsClient, Ownable, AccessControl, ReentrancyGuard {
    using FunctionsRequest for FunctionsRequest.Request;

    error IPFSFunctionsConsumer__UnexpectedRequestID(bytes32 requestId);
    error IPFSFunctionsConsumer__GiftNFTContractCannotBeZero();

    struct FunctionRequest {
        uint256 nftId;
        string publicContentHash; // The public content hash of the character
        bytes error;
    }

    bytes32 public constant SEND_REQUEST_ROLE = keccak256("SEND_REQUEST_ROLE");

    event GiftContentHashUpdated(bytes32 indexed requestId, uint256 indexed nftId, string publicContentHash);
    event GiftNFTContractSet(address giftNFTContract);
    event EncryptedSecretsSet();
    event GasLimitUpdated(uint32 gasLimit);
    event ErrorUpdatingHash(bytes32 indexed requestId, uint256 indexed nftId, bytes error);
    event SourceUdated(string source);

    uint32 public gasLimit;
    bytes32 public immutable donID;
    uint64 public subscriptionId;
    bytes public encryptedSecretsUrls;
    string public source;

    GiftNFT internal giftNFTContract;
    mapping(bytes32 requestId => FunctionRequest request) public requests;

    constructor(
        uint64 _subscriptionId,
        address _router,
        bytes32 _donId,
        uint32 _gasLimit,
        bytes memory _encryptedSecretsUrls
    )
        FunctionsClient(_router)
        Ownable(msg.sender)
    {
        subscriptionId = _subscriptionId;
        donID = _donId;
        gasLimit = _gasLimit;
        encryptedSecretsUrls = _encryptedSecretsUrls;
    }

    function updateSource(string calldata _source) external onlyOwner {
        source = _source;
        emit SourceUdated(_source);
    }

    function updateGasLimit(uint32 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
        emit GasLimitUpdated(_gasLimit);
    }

    function grantSendRequestRole(address account) external onlyOwner {
        _grantRole(SEND_REQUEST_ROLE, account);
    }

    function setGiftNFTContract(address _giftNFTContract) external onlyOwner {
        if (_giftNFTContract == address(0)) {
            revert IPFSFunctionsConsumer__GiftNFTContractCannotBeZero();
        }
        giftNFTContract = GiftNFT(_giftNFTContract);
        emit GiftNFTContractSet(_giftNFTContract);
    }

    function updateEncryptedSecrets(bytes calldata _encryptedSecretsUrls) external onlyOwner {
        encryptedSecretsUrls = _encryptedSecretsUrls;
        emit EncryptedSecretsSet();
    }

    function sendRequest(
        uint256 nftId,
        string[] calldata args
    )
        external
        onlyRole(SEND_REQUEST_ROLE)
        nonReentrant
        returns (bytes32 requestId)
    {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (encryptedSecretsUrls.length > 0) {
            req.addSecretsReference(encryptedSecretsUrls);
        }
        if (args.length > 0) req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
        requests[requestId] = FunctionRequest({ nftId: nftId, publicContentHash: hex"", error: hex"" });
        return requestId;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        FunctionRequest storage request = requests[requestId];
        uint256 nftId = request.nftId;
        if (nftId == 0) {
            revert IPFSFunctionsConsumer__UnexpectedRequestID(requestId);
        }
        if (err.length > 0) {
            request.error = err;
            emit ErrorUpdatingHash(requestId, nftId, err);
        } else {
            request.publicContentHash = string(response);
            giftNFTContract.updateContentHash(nftId, string(response));

            emit GiftContentHashUpdated(requestId, nftId, string(response));
        }
    }
}
