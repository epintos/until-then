"use client";

import { Calendar, DollarSign, Info, Upload } from "lucide-react";
import { useState } from "react";

type YieldOption = "none" | "eth" | "link";

export default function CreateGift() {
  const [formData, setFormData] = useState({
    receiverAddress: "",
    releaseDate: "",
    releaseTime: "",
    amount: "",
    yieldOption: "none" as YieldOption,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const calculateFees = () => {
    const amount = parseFloat(formData.amount) || 0;
    const gasFee = 0.005; // Estimated gas fee
    const platformFee = amount * 0.02; // 2% platform fee
    return {
      gasFee,
      platformFee,
      total: gasFee + platformFee,
    };
  };

  const fees = calculateFees();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    // Simulate gift creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Creating gift:", {
      ...formData,
      file: uploadedFile?.name,
      fees,
    });
    
    setIsCreating(false);
    // Reset form
    setFormData({
      receiverAddress: "",
      releaseDate: "",
      releaseTime: "",
      amount: "",
      yieldOption: "none",
    });
    setUploadedFile(null);
    alert("Gift created successfully!");
  };

  const isFormValid = 
    formData.receiverAddress &&
    formData.releaseDate &&
    formData.releaseTime &&
    formData.amount &&
    parseFloat(formData.amount) > 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Gift</h1>
        <p className="text-gray-600">
          Set up a time-locked gift to be delivered in the future
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receiver Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receiver Address
          </label>
          <input
            type="text"
            value={formData.receiverAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, receiverAddress: e.target.value }))}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Release Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Time
            </label>
            <input
              type="time"
              value={formData.releaseTime}
              onChange={(e) => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Content
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept="image/*,video/*,.pdf,.txt"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {uploadedFile ? (
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">Selected:</span> {uploadedFile.name}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop<br />
                  Images, videos, PDFs, or text files
                </p>
              )}
            </label>
          </div>
        </div>

        {/* Yield Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Yield Option
          </label>
          <div className="space-y-3">
            {[
              { value: "none", label: "No Yield", desc: "Gift amount stays the same" },
              { value: "eth", label: "ETH Staking", desc: "Earn staking rewards (~4% APY)" },
              { value: "link", label: "LINK Token", desc: "Convert to LINK for potential gains" },
            ].map((option) => (
              <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="yieldOption"
                  value={option.value}
                  checked={formData.yieldOption === option.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, yieldOption: e.target.value as YieldOption }))}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.1"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Fee Breakdown */}
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Fee Breakdown</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Fee:</span>
                <span className="font-medium">{fees.gasFee.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (2%):</span>
                <span className="font-medium">{fees.platformFee.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total Fees:</span>
                <span>{fees.total.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between text-blue-600 font-medium">
                <span>Total Required:</span>
                <span>{(parseFloat(formData.amount) + fees.total).toFixed(4)} ETH</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isCreating}
          className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-colors ${
            isFormValid && !isCreating
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isCreating ? "Creating Gift..." : "Create Gift"}
        </button>
      </form>
    </div>
  );
}
