import dotenv from "dotenv";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadFoundryWallet } from "../lib/loadFoundryWallet.js";
dotenv.config();

const updateSource = async () => {
  const untilThenV1Address = "0x0A101f9F99f2730655A02522237B11FF768E84fC";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl)
    throw new Error("rpcUrl not provided - check your environment variables");
  const explorerUrl = "https://sepolia.etherscan.io";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = (await loadFoundryWallet()).connect(provider);
  const signer = wallet.connect(provider);
  const ipfsFunctionsConsumerAbi = JSON.parse(
    readFileSync(path.resolve(__dirname, "../abi/IPFSFunctionsConsumer.json"))
  );
  const untilthenV1Contract = new ethers.Contract(
    untilThenV1Address,
    ipfsFunctionsConsumerAbi,
    signer
  );

  const source = readFileSync(
    path.resolve(__dirname, "../src/source.js")
  ).toString();

  const transaction = await untilthenV1Contract.updateSource(source);

  console.log(`✅ Request sent! Hash: ${transaction.hash}`);
  console.log(`Explorer URL: ${explorerUrl}/tx/${transaction.hash}`);
};

updateSource().catch((err) => {
  console.error(err);
  process.exit(1);
});
