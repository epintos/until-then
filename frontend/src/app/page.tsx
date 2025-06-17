"use client";

import HomeContent from "@/components/HomeContent";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="flex justify-center items-start pt-24 min-h-screen">
      {isConnected ? (
        <div className="w-full max-w-md">
          <HomeContent />
        </div>
      ) : (
        <div className="text-center text-lg font-medium text-gray-700">
          Please connect a wallet ...
        </div>
      )}
    </div>
  );
}
