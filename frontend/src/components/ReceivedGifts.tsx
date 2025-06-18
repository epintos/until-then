"use client";

import { chainsToContracts, giftNFTAbi, untilThenV1Abi } from "@/constants";
import { BrowserProvider, Contract } from "ethers";
import { Calendar, Clock, DollarSign, Gift, Hash, Lock, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Abi } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts, useWriteContract } from "wagmi";

interface Gift {
  id: bigint;
  amount: bigint;
  releaseTimestamp: bigint;
  nftClaimedId: bigint;
  status: number;
  sender: string;
  receiver: string;
  isYield: boolean;
  linkYield: boolean;
  contentHash: string;
}

export default function ReceivedGifts() {
  const { address } = useAccount();
  const chainId = useChainId();
  const untilThenAddress =
    (chainsToContracts[chainId]?.untilThenV1 as `0x${string}`) || "0x";

  // Fetch list of gift IDs
  const { data: giftIdsData } = useReadContract({
    abi: untilThenV1Abi,
    address: untilThenAddress,
    functionName: "getReceiverGiftsIds",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && untilThenAddress !== "0x",
    },
  });

  const giftIds = giftIdsData as bigint[] | undefined;

  // Fetch details for each gift ID
  const { data: giftsData } = useReadContracts({
    contracts: (
      giftIds && giftIds.length > 0
        ? giftIds.map((id) => ({
            abi: untilThenV1Abi as Abi,
            address: untilThenAddress,
            functionName: "getGiftById",
            args: [id],
          }))
        : []
    ),
    query: {
      enabled: !!giftIds && giftIds.length > 0 && untilThenAddress !== "0x",
      // Make sure the query is refetched if giftIds change
      refetchOnWindowFocus: false, // Optional: adjust as needed
    },
  });

  const gifts = giftsData
    ? (giftsData
        .filter((result) => result.status === "success" && result.result !== undefined)
        .map((result) => {
          const gift = result.result as Gift;
          return {
            id: gift.id,
            sender: gift.sender,
            receiver: gift.receiver,
            amount: gift.amount,
            releaseTimestamp: gift.releaseTimestamp,
            status: gift.status,
            nftClaimedId: gift.nftClaimedId,
            isYield: gift.isYield,
            linkYield: gift.linkYield,
            contentHash: gift.contentHash,
          };
        })
        .filter((gift) => gift.status !== 2) as Gift[])
    : undefined;

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Use 24-hour format for consistency
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  const getStatus = (status: number) => {
    switch (status) {
      case 0:
        return "Absent";
      case 1:
        return "Pending";
      case 2:
        return "Claimed";
      default:
        return "Invalid";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: bigint) => {
    return Number(amount) / 10 ** 18; // Assuming 18 decimals
  };

  const getTimeUntilRedeem = (timestamp: bigint) => {
    const now = new Date();
    const diff = Number(timestamp) * 1000 - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const { writeContractAsync } = useWriteContract();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'redeeming' | 'decrypting' | 'done'>('redeeming');
  const [modalMessage, setModalMessage] = useState<string>("");
  const [modalError, setModalError] = useState<string>("");

  // Get the GiftNFT address from the contract (if needed)
  const [giftNFTAddress, setGiftNFTAddress] = useState<string | null>(null);

  // Helper to get the GiftNFT address
  async function fetchGiftNFTAddress() {
    if (giftNFTAddress) return giftNFTAddress;
    if (!untilThenAddress) return null;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(untilThenAddress, untilThenV1Abi, provider);
      const addr = await contract.giftNFTContract();
      setGiftNFTAddress(addr);
      return addr;
    } catch {
      setModalError("Failed to get GiftNFT address");
      return null;
    }
  }

  async function handleRedeem(giftId: bigint, contentHash: string) {
    setModalOpen(true);
    setModalStep('redeeming');
    setModalMessage('Waiting for on-chain confirmation...');
    setModalError("");
    try {
      // 1. Call claimGift
      await writeContractAsync({
        abi: untilThenV1Abi,
        address: untilThenAddress,
        functionName: "claimGift",
        args: [giftId],
      });
      setModalMessage('Waiting for NFT to be minted...');
      // 2. Wait for GiftClaimed event
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(untilThenAddress, untilThenV1Abi, provider);
      const filter = contract.filters.GiftClaimed(null, giftId);
      const nftId = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for GiftClaimed event')), 120000);
        contract.once(filter, (...args) => {
          clearTimeout(timeout);
          resolve(args[3]);
        });
      });
      // 3. If contentHash exists, wait for ContentHashUpdated
      if (contentHash) {
        setModalStep('decrypting');
        setModalMessage('Waiting for content to be decrypted... This can take up to 5 minutes.');
        const giftNFTAddr = await fetchGiftNFTAddress();
        if (!giftNFTAddr) throw new Error('No GiftNFT address');
        const giftNFTContract = new Contract(giftNFTAddr, giftNFTAbi, provider);
        const giftNFTFilter = giftNFTContract.filters.ContentHashUpdated(nftId);
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timed out waiting for ContentHashUpdated event (5 minutes)')), 300000);
          giftNFTContract.once(giftNFTFilter, () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        setModalMessage('Content hash updated!');
      }
      setModalStep('done');
      setModalMessage('Gift successfully redeemed!');
      setTimeout(() => setModalOpen(false), 3000);
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Redemption failed');
      setModalStep('done');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Gifts</h1>
        <p className="text-gray-600">
          Gifts sent to you that are waiting to be redeemed
        </p>
      </div>

      {!gifts || gifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gifts received yet</h3>
          <p className="text-gray-600">
            Gifts sent to your address will appear here
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => {
            const status = getStatus(gift.status);
            const timeUntil = getTimeUntilRedeem(gift.releaseTimestamp);
            const canRedeem = status === "Pending" && timeUntil === null; // Can redeem if pending and time is up

            return (
              <div
                key={gift.id.toString()}
                className={`bg-white border-2 rounded-lg p-6 shadow-sm transition-all ${
                  canRedeem 
                    ? "border-green-200 hover:shadow-lg hover:border-green-300" 
                    : "border-gray-200 hover:shadow-md"
                }`}
              >
                {/* Gift ID and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Gift #{gift.id.toString()}
                    </h3>
                    {canRedeem ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Ready to Redeem
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Time Locked
                      </span>
                    )}
                  </div>
                  {canRedeem && (
                    <Gift className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {/* Content Hash */}
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-mono">
                    {gift.contentHash ? (
                      status === "Pending" ? (
                        <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" />
                      ) : (
                        <a
                          href={`https://pink-geographical-primate-420.mypinata.cloud/${gift.contentHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {`${gift.contentHash.slice(0, 12)}...`}
                        </a>
                      )
                    ) : (
                      "No content"
                    )}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatDate(gift.releaseTimestamp)}
                  </span>
                </div>

                {/* Time Until Redeem */}
                {timeUntil && (
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 font-medium">
                      {timeUntil} remaining
                    </span>
                  </div>
                )}

                {/* Amount */}
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 font-medium">
                    {formatAmount(gift.amount)}{" "}
                    {gift.isYield && gift.linkYield ? "LINK" : "ETH"}
                  </span>
                </div>

                {/* Yield Information */}
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {gift.isYield ? (
                      <span className="text-green-600 font-medium">
                        {gift.linkYield ? "LINK" : "ETH"} Yield
                      </span>
                    ) : (
                      <span className="text-gray-500">No Yield</span>
                    )}
                  </span>
                </div>

                {/* Sender */}
                <div className="pt-3 border-t border-gray-100 mb-4">
                  <p className="text-xs text-gray-500 mb-1">From:</p>
                  <p className="text-sm font-mono text-gray-700">
                    {formatAddress(gift.sender)}
                  </p>
                </div>

                {/* Action Button */}
                <div>
                  {canRedeem && (
                    <button
                      onClick={() => handleRedeem(gift.id, gift.contentHash)}
                      disabled={modalOpen}
                      className="w-full py-2 px-4 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Redeem Gift
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for redeeming progress */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setModalOpen(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Redeeming Gift</h2>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${modalStep === 'redeeming' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                <span>Claiming Gift and creating NFT</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${modalStep === 'decrypting' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                <span>Decrypting Content</span>
              </div>
            </div>
            <div className="mb-2 text-gray-700">{modalMessage}</div>
            {modalError && <div className="text-red-600 font-semibold">{modalError}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
