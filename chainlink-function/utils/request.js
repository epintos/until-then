// utils/request.js
import {
  decodeResult,
  FulfillmentCode,
  ResponseListener,
  ReturnType,
} from "@chainlink/functions-toolkit";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadFoundryWallet } from "../lib/loadFoundryWallet.js";
dotenv.config();

// Equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const untilThenV1Address = "0x0A101f9F99f2730655A02522237B11FF768E84fC";

const makeRequestSepolia = async () => {
  const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
  const explorerUrl = "https://sepolia.etherscan.io";

  const source = readFileSync(
    path.resolve(__dirname, "../src/source.js")
  ).toString();

  const args = [
    "CID", // Replace with private CID
    "address", // Replace with sender
    "address", // Replace with receiver
  ];

  const secrets = {
    PINATA_API_JWT: process.env.PINATA_API_JWT,
    PINATA_GATEWAY: process.env.PINATA_GATEWAY,
    PINATA_PRIVATE_GROUP_ID: process.env.PINATA_PRIVATE_GROUP_ID,
    PINATA_PUBLIC_GROUP_ID: process.env.PINATA_PUBLIC_GROUP_ID,
  };

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl)
    throw new Error("rpcUrl not provided - check your environment variables");

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = (await loadFoundryWallet()).connect(provider);
  const signer = wallet.connect(provider);

  const untilThenV1Abi = JSON.parse(
    readFileSync(path.resolve(__dirname, "../abi/UntilThenV1.json"))
  );

  const untilthenV1Contract = new ethers.Contract(
    untilThenV1Address,
    untilThenV1Abi,
    signer
  );
  const nftId = 1;
  const transaction = await untilthenV1Contract.sendConsumerRequest(
    nftId,
    "address", // Replace with sender address
    "address", // Replace with receiver address
    "CID" // Replace with private CID
  );

  console.log(`✅ Request sent! Hash: ${transaction.hash}`);
  console.log(`Explorer URL: ${explorerUrl}/tx/${transaction.hash}`);

  const responseListener = new ResponseListener({
    provider,
    functionsRouterAddress: routerAddress,
  });

  try {
    const fulfilled = await responseListener.listenForResponseFromTransaction(
      transaction.hash
    );
    const { fulfillmentCode, responseBytesHexstring, errorString } = fulfilled;

    const cost = ethers.utils.formatEther(fulfilled.totalCostInJuels);
    if (fulfillmentCode === FulfillmentCode.FULFILLED) {
      console.log(`✅ Fulfilled. Cost: ${cost} LINK`, fulfilled);
    } else {
      console.log(
        `❌ Not fulfilled. Code: ${fulfillmentCode}. Cost: ${cost} LINK`,
        fulfilled
      );
    }

    if (errorString) {
      console.log("❌ Execution error:", errorString);
    } else {
      const decoded = decodeResult(responseBytesHexstring, ReturnType.string);
      console.log("✅ Decoded result:", decoded);
    }
  } catch (e) {
    console.error("Error listening for response:", e);
  }
};

makeRequestSepolia().catch((err) => {
  console.error(err);
  process.exit(1);
});
