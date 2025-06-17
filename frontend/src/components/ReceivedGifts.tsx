"use client";

import { Calendar, Clock, DollarSign, Gift, Hash, TrendingUp } from "lucide-react";
import { useState } from "react";

interface ReceivedGift {
  id: string;
  contentHash: string;
  timestamp: Date;
  hasYield: boolean;
  yieldType: string;
  amount: number;
  senderAddress: string;
  canRedeem: boolean;
}

// Mock data for demonstration
const mockReceivedGifts: ReceivedGift[] = [
  {
    id: "received-001",
    contentHash: "0xabc123...",
    timestamp: new Date("2024-12-25T10:00:00"), // Past date - can redeem
    hasYield: true,
    yieldType: "ETH",
    amount: 0.8,
    senderAddress: "0x7890...abcd",
    canRedeem: true,
  },
  {
    id: "received-002",
    contentHash: "0xdef456...",
    timestamp: new Date("2025-08-15T14:30:00"), // Future date - cannot redeem yet
    hasYield: false,
    yieldType: "None",
    amount: 0.3,
    senderAddress: "0x1357...2468",
    canRedeem: false,
  },
  {
    id: "received-003",
    contentHash: "0xghi789...",
    timestamp: new Date("2024-11-20T09:15:00"), // Past date - can redeem
    hasYield: true,
    yieldType: "LINK",
    amount: 1.2,
    senderAddress: "0xbdef...9876",
    canRedeem: true,
  },
];

export default function ReceivedGifts() {
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRedeem = async (giftId: string) => {
    setRedeeming(giftId);
    
    // Simulate redemption process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Redeeming gift:", giftId);
    setRedeeming(null);
    alert("Gift redeemed successfully! It will appear in your Claimed Gifts.");
  };

  const getTimeUntilRedeem = (timestamp: Date) => {
    const now = new Date();
    const diff = timestamp.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Gifts</h1>
        <p className="text-gray-600">
          Gifts sent to you that are waiting to be redeemed
        </p>
      </div>

      {mockReceivedGifts.length === 0 ? (
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
          {mockReceivedGifts.map((gift) => {
            const timeUntil = getTimeUntilRedeem(gift.timestamp);
            
            return (
              <div
                key={gift.id}
                className={`bg-white border-2 rounded-lg p-6 shadow-sm transition-all ${
                  gift.canRedeem 
                    ? "border-green-200 hover:shadow-lg hover:border-green-300" 
                    : "border-gray-200 hover:shadow-md"
                }`}
              >
                {/* Gift ID and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Gift #{gift.id.split('-')[1]}
                    </h3>
                    {gift.canRedeem ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Ready to Redeem
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Time Locked
                      </span>
                    )}
                  </div>
                  {gift.canRedeem && (
                    <Gift className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {/* Content Hash */}
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-mono">
                    {gift.contentHash.slice(0, 12)}...
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatDate(gift.timestamp)}
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
                    {gift.amount} ETH
                    {gift.hasYield && (
                      <span className="text-green-600 text-xs ml-1">
                        (+yield)
                      </span>
                    )}
                  </span>
                </div>

                {/* Yield Information */}
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {gift.hasYield ? (
                      <span className="text-green-600 font-medium">
                        {gift.yieldType} Yield
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
                    {gift.senderAddress.slice(0, 6)}...{gift.senderAddress.slice(-4)}
                  </p>
                </div>

                {/* Action Button */}
                <div>
                  {gift.canRedeem ? (
                    <button
                      onClick={() => handleRedeem(gift.id)}
                      disabled={redeeming === gift.id}
                      className={`w-full py-3 px-4 font-medium rounded-lg transition-colors ${
                        redeeming === gift.id
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {redeeming === gift.id ? "Redeeming..." : "Redeem Gift"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 px-4 font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed"
                    >
                      {timeUntil ? `Available in ${timeUntil}` : "Time Locked"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {mockReceivedGifts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockReceivedGifts.filter(g => g.canRedeem).length}
            </div>
            <div className="text-sm text-green-600">Ready to Redeem</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {mockReceivedGifts.filter(g => !g.canRedeem).length}
            </div>
            <div className="text-sm text-yellow-600">Time Locked</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockReceivedGifts.reduce((sum, gift) => sum + gift.amount, 0).toFixed(2)} ETH
            </div>
            <div className="text-sm text-blue-600">Total Value</div>
          </div>
        </div>
      )}
    </div>
  );
}
