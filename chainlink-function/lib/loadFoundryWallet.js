import { Wallet } from "ethers";
import fs from "fs";
import path from "path";
import promptSync from "prompt-sync";

const prompt = promptSync({ sigint: true });

export async function loadFoundryWallet() {
  const addressInput = prompt("Enter Foundry wallet name: ").trim();

  const keystorePath = path.resolve(
    process.env.HOME || ".",
    `.foundry/keystores/${addressInput}`
  );

  if (!fs.existsSync(keystorePath)) {
    throw new Error("Foundry wallet does not exist.");
  }

  const encryptedJson = fs.readFileSync(keystorePath, "utf8");

  const password = prompt("Enter wallet password: ", { echo: "" }).trim();

  return await Wallet.fromEncryptedJson(encryptedJson, password);
}
