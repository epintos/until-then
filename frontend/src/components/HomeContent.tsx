"use client";

import AppDashboard from "@/components/AppDashboard";
import LandingPage from "@/components/LandingPage";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function HomeContent() {
  const { isConnected } = useAccount();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    if (isConnected) {
      setHasStarted(true);
    }
  };

  if (!hasStarted) {
    return (
      <LandingPage 
        onStart={handleStart} 
        isConnected={isConnected} 
      />
    );
  }

  // Show the sidebar and a welcome message on the homepage
  return (
    <div className="flex gap-8 max-w-7xl mx-auto px-6 py-8">
      <AppDashboard isConnected={isConnected} />
      <div className="flex-1 bg-white rounded-lg shadow-sm border p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to the Dashboard</h1>
        <p className="text-lg text-gray-700 mb-4">Use the sidebar to navigate between creating, sending, receiving, and claiming gifts.</p>
        {!isConnected && (
          <p className="text-red-600 text-base mb-4">Please connect your wallet to use the dashboard features.</p>
        )}
        <Link href="/dashboard/create-gift" className={`text-blue-600 hover:underline font-medium${!isConnected ? ' pointer-events-none opacity-50' : ''}`}>Go to Create Gift</Link>
      </div>
    </div>
  );
}
