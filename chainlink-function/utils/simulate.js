// utils/request.js
import {
  decodeResult,
  ReturnType,
  simulateScript,
} from "@chainlink/functions-toolkit";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

// Equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const simulateFunction = async () => {
  const source = readFileSync(
    path.resolve(__dirname, "../src/source.js")
  ).toString();

  const args = [
    "CID", // Replace with private CID
    "address", // Replace with sender address
    "address", // Replace with receiver address
  ];

  const secrets = {
    PINATA_API_JWT: process.env.PINATA_API_JWT,
    PINATA_GATEWAY: process.env.PINATA_GATEWAY,
    PINATA_PRIVATE_GROUP_ID: process.env.PINATA_PRIVATE_GROUP_ID,
    PINATA_PUBLIC_GROUP_ID: process.env.PINATA_PUBLIC_GROUP_ID,
  };

  console.log("Start simulation...");
  const response = await simulateScript({
    source,
    args,
    bytesArgs: [],
    secrets,
  });

  if (response.errorString) {
    console.log("❌ Error during simulation:", response.errorString);
  } else {
    const decodedResponse = decodeResult(
      response.responseBytesHexstring,
      ReturnType.string
    );
    console.log("✅ Decoded response:", decodedResponse);
  }
};

simulateFunction().catch((err) => {
  console.error(err);
  process.exit(1);
});
