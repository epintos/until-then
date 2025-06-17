"use client";

import { chainsToContracts, untilThenV1Abi } from "@/constants";
import { Calendar, DollarSign, Hash, Tag, TrendingUp } from "lucide-react";
import { useAccount, useChainId, useReadContract } from "wagmi";

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

export default function SentGifts() {
  const { address } = useAccount();
  const chainId = useChainId();
  const untilThenAddress =
    (chainsToContracts[chainId]?.untilThenV1 as `0x${string}`) || "0x";


  const { data: giftsData } = useReadContract({
    abi: untilThenV1Abi,
    address: untilThenAddress,
    functionName: "getSenderGifts",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && untilThenAddress !== "0x", // Only enable query if address and contract address are valid
    },
  });

  const gifts = giftsData as Gift[] | undefined;
  console.log("SentGifts - Gifts Data:", gifts);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Claimed":
        return "bg-green-100 text-green-800";
      case "Absent":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: bigint) => {
    return Number(amount) / 10 ** 18; // Assuming 18 decimals
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sent Gifts</h1>
        <p className="text-gray-600">
          Track the gifts you have sent and their status
        </p>
      </div>

      {!gifts || gifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No gifts sent yet
          </h3>
          <p className="text-gray-600">
            Create your first gift to see it appear here
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => {
            const status = getStatus(gift.status);
            return (
              <div
                key={gift.id.toString()}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Gift ID and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Gift #{gift.id.toString()}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        status
                      )}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Content Hash */}
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-mono">
                    {gift.contentHash ? `${gift.contentHash.slice(0, 12)}...` : "No content"}
                  </span>
                </div>

                {/* NFT Claimed ID */}
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-mono">
                    {status === "Pending" ? "Not claimed yet" : gift.nftClaimedId.toString()}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatDate(gift.releaseTimestamp)}
                  </span>
                </div>

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

                {/* Recipient */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Recipient:</p>
                  <p className="text-sm font-mono text-gray-700">
                    {formatAddress(gift.receiver)}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  {status === "Claimed" && (
                    <button className="w-full py-2 px-4 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                      View Transaction
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats - Removed mock data stats since we're using real data now */}
    </div>
  );
}
