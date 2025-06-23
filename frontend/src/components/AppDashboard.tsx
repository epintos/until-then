"use client";


import { chainsToContracts, giveawayAbi, redeemAirdropAutomationAbi } from "@/constants";
import { Crown, Gift, Inbox, Send, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";

const tabs = [
  { id: "create", name: "Create Gift", icon: Gift, href: "/dashboard/create-gift" },
  { id: "sent", name: "Sent Gifts", icon: Send, href: "/dashboard/sent-gifts" },
  { id: "received", name: "Received Gifts", icon: Inbox, href: "/dashboard/received-gifts" },
  { id: "claimed", name: "Claimed Gifts", icon: Crown, href: "/dashboard/claimed-gifts" },
];

export default function AppDashboard() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const { address, status } = useAccount();
  const chainId = useChainId();
  const pathname = usePathname();
  const [publicKey, setPublicKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Prizes: Until ERC20 Airdrop (on redeemAirdropAutomation), Weekly Giveaway (on giveaway)
  const redeemAirdropAddress = chainsToContracts[chainId]?.redeemAirdropAutomation as `0x${string}` | undefined;
  const giveawayAddress = chainsToContracts[chainId]?.giveaway as `0x${string}` | undefined;

  const { data: airdropAmount } = useReadContract({
    abi: redeemAirdropAutomationAbi,
    address: redeemAirdropAddress,
    functionName: "getUserAirdropAmount",
    args: [address],
    query: { enabled: !!address && !!redeemAirdropAddress },
  });

  const { data: giveawayWins } = useReadContract({
    abi: giveawayAbi,
    address: giveawayAddress,
    functionName: "getUserWins",
    args: [address],
    query: { enabled: !!address && !!giveawayAddress },
  });

  const handleGeneratePublicKey = async () => {
    setGenerating(true);
    try {
      if (!window.ethereum || !address) throw new Error("Wallet not connected");
      // Use MetaMask's eth_getEncryptionPublicKey
      const publicKey = await window.ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [address],
      });
      setPublicKey(publicKey);
      setCopied(false);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // --- Always render the sidebar structure ---
  return (
    <div className="w-64 rounded-lg shadow-sm border p-6" style={{ backgroundColor: '#FCF7F3' }}>
      <nav className="space-y-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Only disable links after mount if status is disconnected
          const disabled = hasMounted ? status === "disconnected" : false;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-600${disabled ? ' pointer-events-none opacity-50' : ''}`}
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
            >
              <Icon className="w-5 h-5" />
              <span className={pathname === tab.href ? "font-bold" : undefined}>{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Prizes Panel - only show wallet data after mount */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Prizes
        </h3>
        <div className="mb-6 p-4 rounded-lg flex flex-col items-center" style={{ backgroundColor: '#C7FE93', color: '#2B2B2B' }}>
          <div className="text-xs mb-1">UNTIL Avalanche Airdrop</div>
          <div className="text-3xl font-extrabold tracking-tight mb-1">
            {hasMounted && typeof airdropAmount === 'bigint' ? formatUnits(airdropAmount, 18) : '--'} <span className="text-lg font-bold">UNTIL</span>
          </div>
        </div>
        <div className="mb-6 p-4 rounded-lg flex flex-col items-center" style={{ backgroundColor: '#83BD4E', color: '#2B2B2B' }}>
          <div className="text-xs mb-1">Weekly Giveaway Gains</div>
          <div className="text-3xl font-extrabold tracking-tight mb-1">
            {hasMounted && typeof giveawayWins === 'bigint' ? Number(formatUnits(giveawayWins, 18)).toFixed(4) : '--'} <span className="text-lg font-bold">ETH</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="font-semibold text-gray-800 mb-1">Share your public key</div>
        <div className="text-xs text-gray-600 mb-2">
          Share your Metamask public key with the sender so they can encrypt the gift content. Only you will be able to decrypt and read the message after claiming the gift.
        </div>
        {/* Only show public key UI after mount */}
        {hasMounted && publicKey ? (
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
                    console.error("Could not copy to clipboard. Please make sure the window is focused and try again.");
                  }
                }}
                className="px-3 py-2 btn-primary text-xs font-semibold"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="text-xs text-green-600">{copied ? "Public key copied to clipboard!" : ""}</div>
          </div>
        ) : hasMounted ? (
          <button
            onClick={handleGeneratePublicKey}
            disabled={generating || !address}
            className="w-full px-3 py-2 btn-secondary text-xs font-semibold"
          >
            {generating ? "Generating..." : "Generate & Copy Public Key"}
          </button>
        ) : (
          // Placeholder for layout stability
          <div className="h-10" />
        )}
      </div>
    </div>
  );
}
