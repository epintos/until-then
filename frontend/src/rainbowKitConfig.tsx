"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { sepolia } from "wagmi/chains";

export default getDefaultConfig({
  appName: "UntilThen",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  ssr: true,
});
