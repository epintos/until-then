"use client";


import { Crown, Gift, Inbox, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";

const tabs = [
  { id: "create", name: "Create Gift", icon: Gift, href: "/dashboard/create-gift" },
  { id: "sent", name: "Sent Gifts", icon: Send, href: "/dashboard/sent-gifts" },
  { id: "received", name: "Received Gifts", icon: Inbox, href: "/dashboard/received-gifts" },
  { id: "claimed", name: "Claimed Gifts", icon: Crown, href: "/dashboard/claimed-gifts" },
];

export default function AppDashboard() {
  const { address } = useAccount();
  const [publicKey, setPublicKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const handleGeneratePublicKey = async () => {
    setGenerating(true);
    setError("");
    try {
      if (!window.ethereum || !address) throw new Error("Wallet not connected");
      // Use MetaMask's eth_getEncryptionPublicKey
      const publicKey = await window.ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [address],
      });
      setPublicKey(publicKey);
      setCopied(false);
    } catch (err: any) {
      if (
        err?.code === 'ACTION_REJECTED' ||
        err?.message?.toLowerCase().includes('user rejected')
      ) {
        setError("Signature request was cancelled. Your public key was not generated.");
      } else {
        setError(err.message || "Failed to generate public key");
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <nav className="space-y-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-8">
        <div className="font-semibold text-gray-800 mb-1">Share your public key</div>
        <div className="text-xs text-gray-600 mb-2">
          Share your public key with the sender so they can encrypt the gift content. Only you will be able to decrypt and read the message after claiming the gift.
        </div>
        {publicKey ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicKey}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs bg-gray-50"
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setError("Could not copy to clipboard. Please make sure the window is focused and try again.");
                  }
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="text-xs text-green-600">{copied ? "Public key copied to clipboard!" : ""}</div>
          </div>
        ) : (
          <button
            onClick={handleGeneratePublicKey}
            disabled={generating || !address}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            {generating ? "Generating..." : "Generate & Copy Public Key"}
          </button>
        )}
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>
    </div>
  );
}
