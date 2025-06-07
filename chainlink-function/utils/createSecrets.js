import { SecretsManager, createGist } from "@chainlink/functions-toolkit";
import { ethers } from "ethers";
import { loadFoundryWallet } from "../lib/loadFoundryWallet.js";

import dotenv from "dotenv";
dotenv.config();

const createSecrets = async () => {
  const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
  const donId = "fun-ethereum-sepolia-1";

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl)
    throw new Error("rpcUrl not provided - check your environment variables");

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = (await loadFoundryWallet()).connect(provider);
  const signer = wallet.connect(provider);

  const secrets = {
    PINATA_API_JWT: process.env.PINATA_API_JWT,
    PINATA_GATEWAY: process.env.PINATA_GATEWAY,
    PINATA_PRIVATE_GROUP_ID: process.env.PINATA_PRIVATE_GROUP_ID,
    PINATA_PUBLIC_GROUP_ID: process.env.PINATA_PUBLIC_GROUP_ID,
  };

  // First encrypt secrets and create a gist
  const secretsManager = new SecretsManager({
    signer,
    functionsRouterAddress: routerAddress,
    donId,
  });
  await secretsManager.initialize();
  // Encrypt secrets
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  console.log(`Creating gist...`);
  const githubApiToken = process.env.GITHUB_API_TOKEN;
  if (!githubApiToken)
    throw new Error(
      "githubApiToken not provided - check your environment variables"
    );

  const gistURL =
    process.env.GIST_URL ||
    (await createGist(githubApiToken, JSON.stringify(encryptedSecretsObj)));
  console.log(`\n✅Gist created ${gistURL} . Encrypt the URLs..`);

  const encryptedSecretsUrls = await secretsManager.encryptSecretsUrls([
    gistURL,
  ]);
  console.log(
    `\n✅Encrypted secrets URLs: ${JSON.stringify(encryptedSecretsUrls)}`
  );
};

createSecrets().catch((error) => {
  console.error("Error creating secrets:", error);
});
