"use client";

import HomeContent from "@/components/HomeContent";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50">
      {isConnected ? (
        <HomeContent />
      ) : (
        <div className="flex justify-center items-center pt-24">
          <div className="text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-lg text-gray-600 max-w-md">
              Please connect your Ethereum wallet to start sending and receiving time-locked gifts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
