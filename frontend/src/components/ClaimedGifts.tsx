"use client";

import { Crown, Download, ExternalLink, Hash } from "lucide-react";
import { useState } from "react";

interface ClaimedGift {
  id: string;
  nftId: string;
  contentHash: string;
  imageUrl: string;
  claimedDate: Date;
  originalAmount: number;
  finalAmount: number;
  yieldEarned: number;
  senderAddress: string;
  tokenId: number;
}

// Mock data for demonstration
const mockClaimedGifts: ClaimedGift[] = [
  {
    id: "claimed-001",
    nftId: "GIFT-NFT-001",
    contentHash: "0xabcd1234...",
    imageUrl: "https://via.placeholder.com/300x300/6366f1/ffffff?text=Gift+NFT+1",
    claimedDate: new Date("2024-12-26T10:30:00"),
    originalAmount: 0.8,
    finalAmount: 0.85,
    yieldEarned: 0.05,
    senderAddress: "0x7890...abcd",
    tokenId: 1001,
  },
  {
    id: "claimed-002",
    nftId: "GIFT-NFT-002",
    contentHash: "0xdef5678...",
    imageUrl: "https://via.placeholder.com/300x300/10b981/ffffff?text=Gift+NFT+2",
    claimedDate: new Date("2024-11-21T15:45:00"),
    originalAmount: 1.2,
    finalAmount: 1.35,
    yieldEarned: 0.15,
    senderAddress: "0xbdef...9876",
    tokenId: 1002,
  },
  {
    id: "claimed-003",
    nftId: "GIFT-NFT-003",
    contentHash: "0xghi9012...",
    imageUrl: "https://via.placeholder.com/300x300/f59e0b/ffffff?text=Gift+NFT+3",
    claimedDate: new Date("2024-10-15T08:20:00"),
    originalAmount: 0.5,
    finalAmount: 0.5,
    yieldEarned: 0,
    senderAddress: "0x1357...2468",
    tokenId: 1003,
  },
];

export default function ClaimedGifts() {
  const [selectedGift, setSelectedGift] = useState<ClaimedGift | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetails = (gift: ClaimedGift) => {
    setSelectedGift(gift);
  };

  const handleCloseModal = () => {
    setSelectedGift(null);
  };

  const handleDownload = (gift: ClaimedGift) => {
    // Simulate download of gift content
    console.log("Downloading content for gift:", gift.id);
    alert("Download started! (This would download the actual gift content)");
  };

  const handleViewOnOpenSea = (tokenId: number) => {
    // Simulate opening on OpenSea
    console.log("Opening NFT on OpenSea:", tokenId);
    alert("This would open the NFT on OpenSea marketplace");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Claimed Gifts</h1>
        <p className="text-gray-600">
          Your collection of redeemed gift NFTs
        </p>
      </div>

      {mockClaimedGifts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No claimed gifts yet</h3>
          <p className="text-gray-600">
            Redeem your received gifts to see them as NFTs here
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockClaimedGifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all group"
            >
              {/* NFT Image */}
              <div className="relative aspect-square">
                <img
                  src={gift.imageUrl}
                  alt={`Gift NFT ${gift.nftId}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <button
                    onClick={() => handleViewDetails(gift)}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all transform scale-95 group-hover:scale-100"
                  >
                    View Details
                  </button>
                </div>
                <div className="absolute top-3 right-3">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
              </div>

              {/* NFT Details */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {gift.nftId}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Token ID: #{gift.tokenId}
                  </p>
                </div>

                {/* Content Hash */}
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 font-mono">
                    {gift.contentHash.slice(0, 12)}...
                  </span>
                </div>

                {/* Value Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-medium">{gift.originalAmount} ETH</span>
                  </div>
                  {gift.yieldEarned > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yield:</span>
                      <span className="font-medium text-green-600">+{gift.yieldEarned} ETH</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Final Value:</span>
                    <span className="text-blue-600">{gift.finalAmount} ETH</span>
                  </div>
                </div>

                {/* Claimed Date */}
                <p className="text-xs text-gray-500 mb-4">
                  Claimed: {formatDate(gift.claimedDate)}
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleViewOnOpenSea(gift.tokenId)}
                    className="flex items-center justify-center gap-1 py-2 px-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    OpenSea
                  </button>
                  <button
                    onClick={() => handleDownload(gift)}
                    className="flex items-center justify-center gap-1 py-2 px-3 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Content
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {mockClaimedGifts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {mockClaimedGifts.length}
            </div>
            <div className="text-sm text-purple-600">Total NFTs</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {mockClaimedGifts.reduce((sum, gift) => sum + gift.originalAmount, 0).toFixed(2)} ETH
            </div>
            <div className="text-sm text-blue-600">Original Value</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {mockClaimedGifts.reduce((sum, gift) => sum + gift.yieldEarned, 0).toFixed(2)} ETH
            </div>
            <div className="text-sm text-green-600">Total Yield</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {mockClaimedGifts.reduce((sum, gift) => sum + gift.finalAmount, 0).toFixed(2)} ETH
            </div>
            <div className="text-sm text-yellow-600">Final Value</div>
          </div>
        </div>
      )}

      {/* Modal for Gift Details */}
      {selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedGift.nftId}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <img
                src={selectedGift.imageUrl}
                alt={`Gift NFT ${selectedGift.nftId}`}
                className="w-full aspect-square object-cover rounded-lg mb-4"
              />

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Token ID</label>
                  <p className="text-sm text-gray-900">#{selectedGift.tokenId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Content Hash</label>
                  <p className="text-sm text-gray-900 font-mono break-all">{selectedGift.contentHash}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">From</label>
                  <p className="text-sm text-gray-900 font-mono">
                    {selectedGift.senderAddress.slice(0, 6)}...{selectedGift.senderAddress.slice(-4)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Claimed Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedGift.claimedDate)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Original Amount</label>
                    <p className="text-sm text-gray-900">{selectedGift.originalAmount} ETH</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Final Amount</label>
                    <p className="text-sm text-blue-600 font-semibold">{selectedGift.finalAmount} ETH</p>
                  </div>
                </div>

                {selectedGift.yieldEarned > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Yield Earned</label>
                    <p className="text-sm text-green-600 font-semibold">+{selectedGift.yieldEarned} ETH</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleViewOnOpenSea(selectedGift.tokenId)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on OpenSea
                </button>
                <button
                  onClick={() => handleDownload(selectedGift)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
