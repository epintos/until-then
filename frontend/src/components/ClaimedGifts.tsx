"use client";

import { chainsToContracts, giftNFTAbi, untilThenV1Abi } from "@/constants";
import { Hash, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { Abi } from "viem";
import { useAccount, useChainId, useReadContract, useReadContracts } from "wagmi";

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

  async function fetchAndDecryptContent(contentHash: string, giftId: bigint) {
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
    } catch (err: any) {
      setDecrypting(false);
      alert(err.message || "Failed to decrypt content");
      return null;
    }
  }

  async function handleShowContent(contentHash: string, giftId: bigint) {
    const decrypted = await fetchAndDecryptContent(contentHash, giftId);
    if (decrypted) {
      setModalTitle(`Gift #${giftId} Content`);
      setModalContent(decrypted);
      setModalOpen(true);
    }
  }

  async function handleDownloadContent(contentHash: string, giftId: bigint) {
    const decrypted = await fetchAndDecryptContent(contentHash, giftId);
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

  const handleDownload = (contentHash: string) => {
    if (contentHash) {
      window.open(`https://pink-geographical-primate-420.mypinata.cloud/ipfs/${contentHash}`, "_blank");
    } else {
      alert("No content hash available for download.");
    }
  };

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

      {!claimedNFTs || claimedNFTs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src="/file.svg" alt="No NFTs" className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No claimed gifts yet</h3>
          <p className="text-gray-600">Redeem your received gifts to see them as NFTs here</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {claimedNFTs.map((nft) => {
            const imageUrl = nft.metadata?.image;
            const contentHash = nft.metadata?.contentHash || "";
            return (
              <div
                key={nft.gift.id.toString()}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                {/* NFT Image */}
                <div className="relative aspect-square">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Gift NFT ${nft.gift.id}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* NFT Details */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Gift ID: #{nft.gift.id.toString()}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      NFT ID: #{nft.id.toString()}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">Available From:</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(nft.gift.releaseTimestamp)}
                    </p>
                  </div>

                  {/* Content Hash */}
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 font-mono">
                      {contentHash ? (
                        nft.gift.status === 1 ? (
                          <Lock className="inline-block w-4 h-4 mr-1 text-gray-500" />
                        ) : (
                          <a
                            href={`https://pink-geographical-primate-420.mypinata.cloud/ipfs/${contentHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {`${contentHash.slice(0, 12)}...`}
                          </a>
                        )
                      ) : (
                        <span>Decryption pending</span>
                      )}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleShowContent(contentHash, nft.id)}
                      disabled={!contentHash || decrypting}
                      className="w-1/2 py-2 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-400"
                    >
                      Show content
                    </button>
                    <button
                      onClick={() => handleDownloadContent(contentHash, nft.id)}
                      disabled={!contentHash || decrypting}
                      className="w-1/2 py-2 px-4 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-400"
                    >
                      Download content
                    </button>
                  </div>
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
