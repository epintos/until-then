"use client";

import { Calendar, DollarSign, Hash, TrendingUp } from "lucide-react";

interface SentGift {
  id: string;
  contentHash: string;
  timestamp: Date;
  hasYield: boolean;
  yieldType: string;
  amount: number;
  recipientAddress: string;
  status: "pending" | "claimed" | "expired";
}

// Mock data for demonstration
const mockSentGifts: SentGift[] = [
  {
    id: "gift-001",
    contentHash: "0xabcd1234...",
    timestamp: new Date("2025-12-25T10:00:00"),
    hasYield: true,
    yieldType: "ETH",
    amount: 0.5,
    recipientAddress: "0x1234...5678",
    status: "pending",
  },
  {
    id: "gift-002",
    contentHash: "0xefgh5678...",
    timestamp: new Date("2025-01-01T00:00:00"),
    hasYield: false,
    yieldType: "None",
    amount: 0.25,
    recipientAddress: "0xabcd...efgh",
    status: "claimed",
  },
  {
    id: "gift-003",
    contentHash: "0xijkl9012...",
    timestamp: new Date("2025-07-15T15:30:00"),
    hasYield: true,
    yieldType: "LINK",
    amount: 1.0,
    recipientAddress: "0x9876...4321",
    status: "pending",
  },
];

export default function SentGifts() {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "claimed":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sent Gifts</h1>
        <p className="text-gray-600">
          Track the gifts you have sent and their status
        </p>
      </div>

      {mockSentGifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No gifts sent yet</h3>
          <p className="text-gray-600">
            Create your first gift to see it appear here
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockSentGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Gift ID and Status */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Gift #{gift.id.split('-')[1]}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(gift.status)}`}>
                    {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
                  </span>
                </div>
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

              {/* Amount */}
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 font-medium">
                  {gift.amount} ETH
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

              {/* Recipient */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Recipient:</p>
                <p className="text-sm font-mono text-gray-700">
                  {gift.recipientAddress.slice(0, 6)}...{gift.recipientAddress.slice(-4)}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {gift.status === "pending" && (
                  <button className="w-full py-2 px-4 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    View Details
                  </button>
                )}
                {gift.status === "claimed" && (
                  <button className="w-full py-2 px-4 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                    View Transaction
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {mockSentGifts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockSentGifts.filter(g => g.status === "pending").length}
            </div>
            <div className="text-sm text-blue-600">Pending Gifts</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockSentGifts.filter(g => g.status === "claimed").length}
            </div>
            <div className="text-sm text-green-600">Claimed Gifts</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {mockSentGifts.reduce((sum, gift) => sum + gift.amount, 0).toFixed(2)} ETH
            </div>
            <div className="text-sm text-gray-600">Total Value Sent</div>
          </div>
        </div>
      )}
    </div>
  );
}
