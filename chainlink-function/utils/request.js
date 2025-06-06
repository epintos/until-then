// utils/request.js
import { config } from "@chainlink/env-enc";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadFoundryWallet } from "../lib/loadFoundryWallet.js";

// Equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables using env-enc
config();

const consumerAddress = "0xf1f2bD5EB249A813Be0f4628Fa4Fc8B64F330634";
const subscriptionId = 4929;

const makeRequestSepolia = async () => {
  const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
  const linkTokenAddress = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const donId = "fun-ethereum-sepolia-1";
  const smartContractDonId =
    "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000";
  const explorerUrl = "https://sepolia.etherscan.io";
  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ];

  const source = readFileSync(
    path.resolve(__dirname, "../src/source.js")
  ).toString();

  const args = [
    "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  ];

  const secrets = {
    PINATA_API_JWT: process.env.PINATA_API_JWT,
    PINATA_GATEWAY: process.env.PINATA_GATEWAY,
    PINATA_PRIVATE_GROUP_ID: process.env.PINATA_PRIVATE_GROUP_ID,
    PINATA_PUBLIC_GROUP_ID: process.env.PINATA_PUBLIC_GROUP_ID,
  };

  const slotIdNumber = 1;
  const expirationTimeMinutes = 15;
  const gasLimit = 300000;

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl)
    throw new Error("rpcUrl not provided - check your environment variables");

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = (await loadFoundryWallet()).connect(provider);
  const signer = wallet.connect(provider);

  // console.log("Start simulation...");
  // const response = await simulateScript({
  //   source,
  //   args,
  //   bytesArgs: [],
  //   secrets,
  // });

  // if (response.errorString) {
  //   console.log("❌ Error during simulation:", response.errorString);
  // } else {
  //   const decodedResponse = decodeResult(
  //     response.responseBytesHexstring,
  //     ReturnType.string
  //   );
  //   console.log("✅ Decoded response:", decodedResponse);
  // }

  // console.log("\nEstimate request costs...");
  // const subscriptionManager = new SubscriptionManager({
  //   signer,
  //   linkTokenAddress,
  //   functionsRouterAddress: routerAddress,
  // });
  // await subscriptionManager.initialize();

  // const gasPriceWei = await signer.getGasPrice();
  // const estimatedCostInJuels =
  //   await subscriptionManager.estimateFunctionsRequestCost({
  //     donId,
  //     subscriptionId,
  //     callbackGasLimit: gasLimit,
  //     gasPriceWei: BigInt(gasPriceWei.toString()),
  //   });

  // console.log(
  //   `Estimated cost: ${ethers.utils.formatEther(estimatedCostInJuels)} LINK`
  // );

  // console.log("\nUpload requests request...");
  // const secretsManager = new SecretsManager({
  //   signer,
  //   functionsRouterAddress: routerAddress,
  //   donId,
  // });
  // await secretsManager.initialize();

  // const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  // const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
  //   encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
  //   gatewayUrls,
  //   slotId: slotIdNumber,
  //   minutesUntilExpiration: expirationTimeMinutes,
  // });

  // if (!uploadResult.success) throw new Error("Secrets upload failed");

  // const donHostedSecretsVersion = parseInt(uploadResult.version);
  // console.log(
  //   `✅ Secrets uploaded to DON. Version: ${donHostedSecretsVersion}`
  // );

  const donHostedSecretsVersion = 1749224682; // Use the version from the upload result in a real scenario

  const ipfsFunctionsConsumerAbi = JSON.parse(
    readFileSync(path.resolve(__dirname, "../abi/IPFSFunctionsConsumer.json"))
  );

  const ipfsFunctionsConsumer = new ethers.Contract(
    consumerAddress,
    ipfsFunctionsConsumerAbi,
    signer
  );
  const nftId = 1;
  const transaction = await ipfsFunctionsConsumer.sendRequest(nftId, args);

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
      const decoded = decodeResult(responseBytesHexstring, ReturnType.uint256);
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
