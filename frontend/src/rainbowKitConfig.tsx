"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export default getDefaultConfig({
  appName: "UntilThen",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [ sepolia],
  ssr: false
});
