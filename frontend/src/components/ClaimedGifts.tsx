"use client";

import { chainsToContracts, giftNFTAbi, untilThenV1Abi } from "@/constants";
import { Download, Hash, Loader, Lock } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Abi, formatEther, formatUnits } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";

interface Gift {
  id: bigint;
  amount: bigint;
  amountClaimed: bigint;
  releaseTimestamp: bigint;
  claimedTimestamp: bigint;
  nftClaimedId: bigint;
  status: number;
  sender: string;
  receiver: string;
  isYield: boolean;
  linkYield: boolean;
  contentHash: string;
}

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  image: string;
  contentHash: string;
}

interface ClaimedNFT {
  id: bigint;
  tokenURI: string;
  metadata?: NFTMetadata;
  gift: Gift;
}

export default function ClaimedGifts() {
  const { address } = useAccount();
  const chainId = useChainId();
  const untilThenAddress =
    (chainsToContracts[chainId]?.untilThenV1 as `0x${string}`) || "0x";
  const giftNFTAddress =
    (chainsToContracts[chainId]?.giftNFT as `0x${string}`) || "0x";

  // Fetch list of claimed gift IDs from UntilThenV1
  const { data: claimedGiftIdsData } = useReadContract({
    abi: untilThenV1Abi,
    address: untilThenAddress,
    functionName: "getReceiverGiftsIds",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && untilThenAddress !== "0x",
    },
  });

  const claimedGiftIds = claimedGiftIdsData as bigint[] | undefined;

  // Fetch details for each claimed gift ID from UntilThenV1
  const { data: giftDetailsData } = useReadContracts({
    contracts: (
      claimedGiftIds && claimedGiftIds.length > 0
        ? claimedGiftIds.map((id) => ({
            abi: untilThenV1Abi as Abi,
            address: untilThenAddress,
            functionName: "getGiftById",
            args: [id],
          }))
        : []
    ),
    query: {
      enabled: !!claimedGiftIds && claimedGiftIds.length > 0 && untilThenAddress !== "0x",
      refetchOnWindowFocus: false,
    },
  });

  const gifts = useMemo(() => {
    return giftDetailsData
      ? (giftDetailsData
          .filter((result) => result.status === "success" && result.result !== undefined)
          .map((result) => result.result) as Gift[])
          .filter((gift) => gift.status === 2)
      : undefined;
  }, [giftDetailsData]);

  // Fetch tokenURI for each claimed NFT from GiftNFT contract
  const { data: tokenURIDataRaw } = useReadContracts({
    contracts: (
      gifts && gifts.length > 0
        ? gifts.map((gift) => ({
            abi: giftNFTAbi as Abi,
            address: giftNFTAddress,
            functionName: "tokenURI",
            args: [gift.nftClaimedId],
          }))
        : []
    ),
    query: {
      enabled: !!gifts && gifts.length > 0 && giftNFTAddress !== "0x",
      refetchOnWindowFocus: false,
    },
  });
  // Memoize tokenURIs from raw data
  const tokenURIs = useMemo(() => {
    if (!tokenURIDataRaw) return undefined;
    return tokenURIDataRaw.map((item) => {
      if (item.status === "success" && typeof item.result === "string") {
        return item.result;
      }
      return undefined;
    }).filter((uri) => uri !== undefined) as string[];
  }, [tokenURIDataRaw]);

  const claimedNFTs: ClaimedNFT[] | undefined = useMemo(() => {
    if (!gifts || !tokenURIs) {
      return undefined;
    }

    const nfts: ClaimedNFT[] = [];
    for (let i = 0; i < gifts.length; i++) {
      const gift = gifts[i];
      const tokenUri = tokenURIs[i];
      let metadata: NFTMetadata | undefined;

      if (tokenUri) {
        try {
          const parsedMetadata = JSON.parse(tokenUri);
          const contentHashFromAttributes = parsedMetadata.attributes.find((attr: NFTAttribute) => attr.trait_type === "contentHash")?.value || "";
          const imageUrlFromMetadata = parsedMetadata.image.replace("ipfs://", "https://pink-geographical-primate-420.mypinata.cloud/ipfs/");

          metadata = {
            image: imageUrlFromMetadata,
            contentHash: contentHashFromAttributes,
          };
        } catch (error) {
          console.error("Error parsing tokenURI JSON:", error);
        }
      }

      nfts.push({
        tokenURI: tokenUri || "",
        metadata,
        id: gift.nftClaimedId,
        gift,
      });
    }
    return nfts;
  }, [gifts, tokenURIs]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [decrypting, setDecrypting] = useState(false);
  const [highlightLast, setHighlightLast] = useState(false);
  const lastCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('highlightLastClaimedGift')) {
      setHighlightLast(true);
      localStorage.removeItem('highlightLastClaimedGift');
      setTimeout(() => setHighlightLast(false), 3000);
      // Optionally scroll into view
      setTimeout(() => {
        lastCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  async function fetchAndDecryptContent(contentHash: string) {
    setDecrypting(true);
    try {
      const res = await fetch(`https://pink-geographical-primate-420.mypinata.cloud/ipfs/${contentHash}`);
      if (!res.ok) throw new Error("Failed to fetch content from IPFS");
      const data = await res.json();
      const encryptedContent = data.encryptedContent;
      if (!window.ethereum || !address) throw new Error("MetaMask not available or wallet not connected");
      // Decrypt using MetaMask
      const decrypted = await window.ethereum.request({
        method: 'eth_decrypt',
        params: [encryptedContent, address],
      });
      setDecrypting(false);
      return decrypted;
    } catch (err: unknown) {
      setDecrypting(false);
      if (
        typeof err === 'object' && err !== null && 'message' in err &&
          typeof (err as { message?: unknown }).message === 'string' &&
          (err as { message: string }).message.includes('User denied message decryption')
      ) {
        // Only log to console, do not alert
        console.error(err);
        return null;
      }
      if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        alert((err as { message: string }).message || "Failed to decrypt content");
      } else {
        alert("Failed to decrypt content");
      }
      return null;
    }
  }

  async function handleShowContent(contentHash: string, giftId: bigint) {
    const decrypted = await fetchAndDecryptContent(contentHash);
    if (decrypted) {
      setModalTitle(`Gift #${giftId} Content`);
      setModalContent(decrypted);
      setModalOpen(true);
    }
  }

  async function handleDownloadContent(contentHash: string, giftId: bigint) {
    const decrypted = await fetchAndDecryptContent(contentHash);
    if (decrypted) {
      const blob = new Blob([decrypted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gift-id-${giftId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000); // Convert Unix timestamp to milliseconds
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Claimed Gifts</h1>
        <p className="text-gray-600">Your collection of redeemed gift NFTs</p>
      </div>

      {claimedNFTs === undefined ? (
        <div className="flex justify-center items-center py-16">
          <Loader className="animate-spin w-10 h-10 text-gray-400" />
        </div>
      ) : !claimedNFTs || claimedNFTs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image src="/file.svg" alt="No NFTs" className="w-8 h-8 text-gray-400" width={32} height={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No claimed gifts yet</h3>
          <p className="text-gray-600">Redeem your received gifts to see them as NFTs here</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {claimedNFTs.map((nft, idx) => {
            const imageUrl = nft.metadata?.image;
            const isLast = idx === claimedNFTs.length - 1;
            return (
            <div
                key={nft.gift.id.toString()}
                ref={isLast ? lastCardRef : undefined}
                className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group border-gray-200 ${highlightLast && isLast ? 'ring-4 ring-blue-400 border-blue-400' : ''}`}
            >
              {/* NFT Image */}
                <div className="relative w-full h-[120px]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`Gift NFT ${nft.gift.id}`}
                  className="w-full h-full object-cover"
                      width={160}
                      height={120}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">No Image</div>
                  )}
              </div>

              {/* NFT Details */}
                <div className="p-3">
                <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1 text-base">
                      Gift ID: #{nft.gift.id.toString()}
                  </h3>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#C7FE93', color: '#24584D' }}>
                      Claimed
                    </span>
                    <p className="text-xs text-gray-600 mb-1">
                      NFT ID: #{nft.id.toString()}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Claimed on:</p>
                    <p className="text-xs text-gray-700 mb-2">
                      {formatDate(nft.gift.claimedTimestamp || nft.gift.releaseTimestamp)}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Amount Sent:</p>
                    <p className="text-xs text-gray-700 mb-1">
                      {nft.gift.linkYield ? formatUnits(nft.gift.amount, 18) : formatEther(nft.gift.amount)} {nft.gift.linkYield ? 'LINK' : 'ETH'}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Amount Claimed:</p>
                    <p className="text-xs text-gray-700">
                      {nft.gift.linkYield ? formatUnits(nft.gift.amountClaimed || BigInt(0), 18) : formatEther(nft.gift.amountClaimed || BigInt(0))} {nft.gift.linkYield ? 'LINK' : 'ETH'}
                  </p>
                </div>

                  {/* Content Hash - Only show if gift has contentHash */}
                  {nft.gift.contentHash && (
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600 font-mono">
                        {nft.metadata?.contentHash ? (
                          nft.gift.status === 1 ? (
                            <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" />
                          ) : (
                            <a
                              href={`https://pink-geographical-primate-420.mypinata.cloud/ipfs/${nft.metadata.contentHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {`${nft.metadata.contentHash.slice(0, 12)}...`}
                            </a>
                          )
                        ) : (
                          <span>Decryption pending</span>
                        )}
                  </span>
                    </div>
                  )}

                  {/* Action Buttons - Only show if gift has contentHash */}
                  {nft.gift.contentHash && (
                    <div className="mt-4 flex gap-2">
                  <button
                        onClick={() => handleShowContent(nft.metadata?.contentHash || "", nft.id)}
                        disabled={!nft.metadata?.contentHash || decrypting}
                        className="w-1/2 py-1 px-2 text-xs btn-primary flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-400"
                  >
                        Show content
                  </button>
                  <button
                        onClick={() => handleDownloadContent(nft.metadata?.contentHash || "", nft.id)}
                        disabled={!nft.metadata?.contentHash || decrypting}
                        className="w-1/2 py-1 px-2 text-xs btn-secondary flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-400"
                  >
                        <Download className="w-4 h-4" aria-label="Download content" />
                  </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for showing decrypted content */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setModalOpen(false)}
                >
              ×
                </button>
            <h2 className="text-lg font-bold mb-4">{modalTitle}</h2>
            <pre className="whitespace-pre-wrap break-words text-gray-800 bg-gray-50 rounded p-4 max-h-96 overflow-auto">{modalContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
