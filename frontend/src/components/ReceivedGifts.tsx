"use client";

import { chainsToContracts, giftNFTAbi, untilThenV1Abi } from "@/constants";
import { BrowserProvider, Contract } from "ethers";
import { Calendar, Clock, DollarSign, Gift, Hash, Loader, Lock, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
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
  const { address, status } = useAccount();
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
  const [modalStep, setModalStep] = useState<'redeeming' | 'decrypting' | 'done' | 'error'>('redeeming');
  const [modalError, setModalError] = useState<string>("");
  const [progress, setProgress] = useState(0);

  // Get the GiftNFT address from the contract (if needed)
  const [giftNFTAddress, setGiftNFTAddress] = useState<string | null>(null);

  // Add a new state to track if waiting for wallet confirmation and to store the last redeem args for retry
  const [waitingForWallet, setWaitingForWallet] = useState(false);
  const [lastRedeemArgs, setLastRedeemArgs] = useState<{giftId: bigint, contentHash: string} | null>(null);

  // Add a state to store the claimed NFT ID
  const [claimedNftId, setClaimedNftId] = useState<string | null>(null);

  // Restore progress bar animation
  useEffect(() => {
    if (!modalOpen) {
      setProgress(0);
      return;
    }
    if (modalStep === 'redeeming') {
      setProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += 100 / 60; // 60 steps for 1 min
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    } else if (modalStep === 'decrypting') {
      setProgress(0);
      let p = 0;
      const interval = setInterval(() => {
        p += 100 / 300; // 300 steps for 5 min
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    } else if (modalStep === 'done') {
      setProgress(100);
    }
  }, [modalOpen, modalStep]);

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
    setModalError("");
    setWaitingForWallet(true);
    setLastRedeemArgs({ giftId, contentHash });
    try {
      // Wait for user to confirm tx
      await writeContractAsync({
        abi: untilThenV1Abi,
        address: untilThenAddress,
        functionName: "claimGift",
        args: [giftId],
      });
      setWaitingForWallet(false);
      // Start progress bar for redeeming
      setModalStep('redeeming');
      // 2. Wait for GiftClaimed event
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(untilThenAddress, untilThenV1Abi, provider);
      const filter = contract.filters.GiftClaimed(null, giftId);
      const nftId: unknown = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting NFT creation')), 120000);
        contract.once(filter, (eventPayload) => {
          clearTimeout(timeout);
          // ethers v6: eventPayload is a ContractEventPayload object with .args property
          let nftId;
          if (eventPayload && typeof eventPayload === 'object' && 'args' in eventPayload && Array.isArray(eventPayload.args)) {
            nftId = eventPayload.args[3];
          } else {
            // fallback for array style
            nftId = eventPayload[3];
          }
          let claimedId;
          if (typeof nftId === 'bigint') {
            claimedId = nftId.toString();
          } else if (typeof nftId === 'string') {
            claimedId = nftId;
          } else if (nftId && typeof nftId === 'object' && 'toString' in nftId && typeof nftId.toString === 'function') {
            claimedId = nftId.toString();
          } else {
            claimedId = String(nftId);
          }
          setClaimedNftId(claimedId);
          resolve(nftId);
        });
      });
      // If contentHash, just wait for ContentHashUpdated, but don't try to extract the ID from it
      if (contentHash) {
        setModalStep('decrypting');
        const giftNFTAddr = await fetchGiftNFTAddress();
        if (!giftNFTAddr) throw new Error('No GiftNFT address');
        const giftNFTContract = new Contract(giftNFTAddr, giftNFTAbi, provider);
        const giftNFTFilter = giftNFTContract.filters.ContentHashUpdated(nftId);
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timed out waiting for decryption')), 300000);
          giftNFTContract.once(giftNFTFilter, () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
      setModalStep('done');
    } catch (error) {
      setWaitingForWallet(false);
      console.error(error);
      setModalError('Something went wrong. Please try again.');
      setModalStep('error');
    }
  }

  // Loading state: show spinner only if status is connecting and address is present
  if (status === "connecting" && address) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin w-10 h-10 text-gray-400" />
      </div>
    );
  }

  // Always render the title and description
  const header = (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Gifts</h1>
      <p className="text-gray-600">
        Gifts sent to you that are waiting to be redeemed
      </p>
    </div>
  );

  // Show empty state if giftIds is an empty array
  if (giftIds && giftIds.length === 0) {
    return (
      <div>
        {header}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gifts received yet</h3>
          <p className="text-gray-600">
            Gifts sent to your address will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      {gifts === undefined ? (
        <div className="flex justify-center items-center py-16">
          <Loader className="animate-spin w-10 h-10 text-gray-400" />
        </div>
      ) : !gifts || gifts.length === 0 ? (
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
                className={`bg-white border-2 rounded-lg p-4 shadow-sm transition-all ${
                  canRedeem 
                    ? "border-green-200 hover:shadow-lg hover:border-green-300" 
                    : "border-gray-200 hover:shadow-md"
                }`}
              >
                {/* Gift ID and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 mb-1">
                      Gift #{gift.id.toString()}
                    </h3>
                    {canRedeem ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#E9E5FD', color: '#24584D' }}>
                        Ready to Redeem
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#816EE2', color: '#fff' }}>
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
                  <span className="text-xs text-gray-600 font-mono">
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
                      "No letter"
                    )}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {formatDate(gift.releaseTimestamp)}
                  </span>
                </div>

                {/* Time Until Redeem */}
                {timeUntil && (
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium">
                      {timeUntil} remaining
                    </span>
                  </div>
                )}

                {/* Amount */}
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-900 font-medium">
                    {formatAmount(gift.amount)}{" "}
                    {gift.isYield && gift.linkYield ? "LINK" : "ETH"}
                  </span>
                </div>

                {/* Yield Information */}
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
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
                      className="w-full py-2 px-4 text-sm btn-primary"
                    >
                      Claim Gift
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
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-0 bg-transparent shadow-none border-none"
              style={{ background: 'none' }}
              onClick={() => setModalOpen(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Claiming Gift</h2>
            {/* Waiting for wallet confirmation */}
            {waitingForWallet ? (
              <div className="mb-4 w-full text-center text-gray-700">Waiting for wallet confirmation...</div>
            ) : modalStep === 'error' ? (
              <>
                <div className="mb-4 w-full text-center text-red-600 font-semibold">{modalError}</div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 btn-primary rounded"
                    onClick={() => lastRedeemArgs && handleRedeem(lastRedeemArgs.giftId, lastRedeemArgs.contentHash)}
                  >
                    Retry
                  </button>
                  <button
                    className="px-4 py-2 btn-secondary rounded"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    {modalStep === 'redeeming' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#816EE2' }}></span>
                        <span>Claiming your gift in the shape of an NFT</span>
                      </div>
                    )}
                    {modalStep === 'decrypting' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#816EE2' }}></span>
                        <span>Making encrypted content available</span>
                      </div>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, backgroundColor: '#816EE2' }}
                    />
                  </div>
                </div>
                {modalStep === 'redeeming' && (
                  <div className="mt-4 text-center text-gray-700">This might take a minute...</div>
                )}
                {modalStep === 'decrypting' && (
                  <>
                    <div className="mt-4 text-center text-gray-700">This can take up to 5 minutes...</div>
                    <details className="mt-4 w-full max-w-md mx-auto bg-gray-50 rounded p-3 border border-gray-200">
                      <summary className="cursor-pointer font-semibold text-gray-800">How does this work?</summary>
                      <div className="mt-2 text-gray-600 text-sm">
                      The content is initially uploaded in encrypted form to Pinata&apos;s private IPFS. A Chainlink Function then moves the file to a public Pinata IPFS, making it accessible for decryption once it has been claimed. This step waits for an event emitted upon completion of the Chainlink Function.
                      </div>
                    </details>
                  </>
                )}
                {modalStep === 'done' && (
                  <>
                    <Image
                      src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeDF1N3V0c3l3NXJhYmN4MHpseGc4cHdtdGEwcnpocXMzbG55c2s1cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hVVJisUlKBgQYc6PQh/giphy.gif"
                      alt="Gift animation"
                      className="my-4 mx-auto rounded-lg shadow"
                      style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                      width={200}
                      height={200}
                    />
                    <div className="mb-2 text-gray-700 text-center font-semibold">
                      NFT with ID: {claimedNftId} has been claimed. The NFT includes the contents of your gift. Enjoy!
                    </div>
                    <div className="flex justify-center mt-4">
                      <button
                        className="px-4 py-2 btn-primary rounded"
                        onClick={() => setModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
