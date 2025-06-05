// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { FunctionsClient } from "@chainlink/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { FunctionsRequest } from "@chainlink/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

import { GiftNFT } from "src/GiftNFT.sol";

contract IPFSFunctionsConsumer is FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    error IPFSFunctionsConsumer__UnexpectedRequestID(bytes32 requestId);

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

    string source = "const cid = args[0];" "const senderAddress = args[1];" "const receiverAddress = args[2];"
        "if (!cid) throw new Error(\"Missing CID\");" "if (!senderAddress) throw new Error(\"Missing senderAddress\");"
        "if (!receiverAddress) throw new Error(\"Missing receiverAddress\");" "" "function sleep(ms) {"
        "  return new Promise((resolve) => setTimeout(resolve, ms));" "}" "" "function validateSecrets(requiredKeys) {"
        "  for (const key of requiredKeys) {" "    if (!secrets[key]) {"
        "      throw new Error(`Missing required secret: ${key}`);" "    }" "  }" "}" "" "validateSecrets(["
        "  \"PINATA_API_JWT\"," "  \"PINATA_GATEWAY\"," "  \"PINATA_PRIVATE_GROUP_ID\"," "  \"PINATA_PUBLIC_GROUP_ID\","
        "]);" "" "const authHeaders = () => ({" "  Authorization: `Bearer ${secrets.PINATA_API_JWT}`,"
        "  \"Content-Type\": \"application/json\"," "});" "" "async function getDownloadLink(cid) {"
        "  const url = `${secrets.PINATA_GATEWAY}/files/${cid}`;" "  const response = await Functions.makeHttpRequest({"
        "    method: \"POST\"," "    url: \"https://api.pinata.cloud/v3/files/private/download_link\","
        "    headers: authHeaders()," "    data: {" "      url," "      expires: 180,"
        "      date: Math.floor(Date.now() / 1000)," "      method: \"GET\"," "    }," "  });"
        "  return response.data.data;" "}" "" "async function fetchPrivateContent(downloadUrl) {"
        "  const response = await Functions.makeHttpRequest({" "    method: \"GET\"," "    url: downloadUrl," "  });"
        "  return response.data;" "}" "" "async function getPrivateFileInfo(cid) {"
        "  const response = await Functions.makeHttpRequest({" "    method: \"GET\","
        "    url: `https://api.pinata.cloud/v3/files/private?group=${secrets.PINATA_PRIVATE_GROUP_ID}&cid=${cid}`,"
        "    headers: authHeaders()," "  });" "  return response.data.data.files[0];" "}" ""
        "async function pinPublicVersion(content, privateInfo) {" "  const metadata = {"
        "    name: `${privateInfo.name.replace(/\\.json$/i, \"\")}-public.json`,"
        "    keyvalues: { privateCid: privateInfo.cid, senderAddress, receiverAddress }," "  };"
        "  const response = await Functions.makeHttpRequest({" "    method: \"POST\","
        "    url: \"https://api.pinata.cloud/pinning/pinJSONToIPFS\"," "    headers: authHeaders()," "    data: {"
        "      pinataContent: content," "      pinataMetadata: metadata," "    }," "  });" "  return response.data;" "}"
        "" "async function assignToPublicGroup(newId) {" "  await Functions.makeHttpRequest({" "    method: \"PUT\","
        "    url: `https://api.pinata.cloud/v3/groups/public/${secrets.PINATA_PUBLIC_GROUP_ID}/ids/${newId}`,"
        "    headers: authHeaders()," "  });" "}" "" "async function deletePrivateFile(privateId) {"
        "  const response = await Functions.makeHttpRequest({" "    method: \"DELETE\","
        "    url: `https://api.pinata.cloud/v3/files/private/${privateId}`," "    headers: authHeaders()," "  });"
        "  console.log(response);" "}" "" "// --- Execution Flow ---" "let newCid;" "try {"
        "  const downloadUrl = await getDownloadLink(cid);"
        "  const privateContent = await fetchPrivateContent(downloadUrl);"
        "  const privateInfo = await getPrivateFileInfo(cid);"
        "  const publicData = await pinPublicVersion(privateContent, privateInfo);" "  newCid = publicData.IpfsHash;" ""
        "  await assignToPublicGroup(publicData.ID);" "  // await sleep(2500);"
        "  // await deletePrivateFile(privateInfo.id);" "} catch (error) {" "  console.log(\"Error occurred:\", error);"
        "}" "" "return Functions.encodeString(newCid);" "";

    //Callback gas limit
    uint32 gasLimit = 300_000;

    // donID - Hardcoded for Sepolia
    // Check to get the donID for your supported network https://docs.chain.link/chainlink-functions/supported-networks
    bytes32 donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    // State variable to store the returned character information
    uint64 public subscriptionId;
    GiftNFT internal giftNFTContract;
    mapping(bytes32 requestId => FunctionRequest request) public requests;

    constructor(uint64 _subscriptionId, address _giftNFTContract) FunctionsClient(router) Ownable(msg.sender) {
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
            revert IPFSFunctionsConsumer__UnexpectedRequestID(requestId);
        }
        if (err.length > 0) {
            request.error = err;
        }
        request.publicContentHash = string(response);
        giftNFTContract.updateContentHash(request.nftId, bytes(response));

        emit GiftContentHashUpdated(requestId, string(response), err);
    }
}
