"use client";
import Link from "next/link";
import { useAccount } from "wagmi";

export default function DashboardPage() {
  const { isConnected } = useAccount();
  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm border p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Ready to send gifts?</h1>
      <p className="text-lg text-gray-700 mb-4">Use the sidebar to navigate between creating, sending, receiving, and claiming gifts.</p>
      {!isConnected && (
        <p className="text-red-600 text-base mb-4">Please connect your wallet to use the dashboard features.</p>
      )}
      <Link href="/dashboard/create-gift" className={`text-blue-600 hover:underline font-medium${!isConnected ? ' pointer-events-none opacity-50' : ''}`}>Go to Create Gift</Link>
    </div>
  );
} 
