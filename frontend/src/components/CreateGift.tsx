"use client";

import { encrypt } from '@metamask/eth-sig-util';
import { Calendar, Info, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Address, formatEther, parseEther } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { chainsToContracts, erc20Abi, untilThenV1Abi } from "../constants";

type YieldOption = "none" | "eth" | "link";

export default function CreateGift() {
  console.log("CreateGift component rendered");
  const chainId = useChainId();
  const { address: connectedAddress } = useAccount();
  const [formData, setFormData] = useState({
    receiverAddress: "",
    receiverPublicKey: "",
    releaseDate: "",
    amount: "",
    yieldOption: "none" as YieldOption,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [contentHash, setContentHash] = useState<string | undefined>(undefined);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [giftCreated, setGiftCreated] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [buttonState, setButtonState] = useState<'idle' | 'creating' | 'created' | 'error'>('idle');
  const [isGiftTx, setIsGiftTx] = useState(false);
  const { isSuccess, isError, error: txError } = useWaitForTransactionReceipt({ hash: txHash });
  const [approveLinkState, setApproveLinkState] = useState<'idle' | 'approving' | 'approved' | 'error'>('idle');

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId });

  const { data: linkAllowance, refetch: refetchLinkAllowance } = useReadContract({
    abi: erc20Abi,
    address: chainsToContracts[chainId].linkToken as Address,
    functionName: "allowance",
    args: [(connectedAddress || "0x0") as Address, chainsToContracts[chainId].aaveYieldManager as Address],
    query: {
      enabled: connectedAddress && formData.yieldOption === "link",
    },
  });

  // Refetch LINK allowance after approval is confirmed
  useEffect(() => {
    if (linkAllowance !== undefined && linkAllowance !== null && typeof linkAllowance === 'bigint' && linkAllowance >= parseEther(formData.amount || "0")) {
      refetchLinkAllowance();
    }
  }, [linkAllowance, refetchLinkAllowance]);

  useEffect(() => {
    console.log('isSuccess', isSuccess, 'isError', isError, 'buttonState', buttonState);
    if (isGiftTx && isSuccess) {
      setButtonState('created');
      // Reset form fields after successful gift creation only
      setFormData((prev) => ({
        ...prev,
        receiverAddress: "",
        receiverPublicKey: "",
        releaseDate: "",
        amount: "",
        // Do not reset yieldOption so user can keep their selection
      }));
      setUploadedFile(null);
      setTimeout(() => setButtonState('idle'), 5000);
      setIsGiftTx(false);
    } else if (isGiftTx && isError) {
      setButtonState('error');
      if (txError) console.error('Transaction failed:', txError);
      setTimeout(() => setButtonState('idle'), 5000);
      setIsGiftTx(false);
    }
  }, [isSuccess, isError, txError, isGiftTx]);

  const calculateFees = () => {
    const amountAsNumber = parseFloat(formData.amount) || 0; // This is the input as a number (e.g., 0.001 or 10).

    let contentUploadFee = 0;
    if (uploadedFile) {
      contentUploadFee = 0.01;
    }

    let platformFee = 0;
    if (formData.yieldOption === "eth") {
      platformFee = Math.max(amountAsNumber * 0.10, 0.0001); // amountAsNumber is already in ETH for calc
    } else if (formData.yieldOption === "link") {
      platformFee = Math.max(amountAsNumber * 0.10, 0.05); // amountAsNumber is already in LINK for calc
    } else if (formData.yieldOption === "none") {
      platformFee = 0.0001; // Fixed platform fee for no yield
    }

    let totalEthFees = contentUploadFee; // Always include content upload fee if present

    if (formData.yieldOption === "none") {
      totalEthFees += platformFee; // Add platform fee ONLY for "No Yield"
    }

    return {
      contentUploadFee: contentUploadFee,
      platformFee: platformFee, // This will still hold the LINK platform fee for display purposes.
      total: totalEthFees,
    };
  };

  const fees = calculateFees();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith(".txt")) {
      setUploadedFile(file);
    } else if (file) {
      alert("Only .txt files are allowed.");
      setUploadedFile(null);
      event.target.value = ''; // Clear the file input
    }
  };

  const handleApproveLink = async () => {
    if (!connectedAddress || !formData.amount) return;
    if (!publicClient) {
      setApproveLinkState('error');
      alert('No public client available for transaction confirmation.');
      return;
    }
    try {
      setApproveLinkState('approving');
      const txHash = await writeContractAsync({
        abi: erc20Abi,
        address: chainsToContracts[chainId].linkToken as Address,
        functionName: "approve",
        args: [chainsToContracts[chainId].aaveYieldManager as Address, parseEther(formData.amount)],
      });
      // Wait for the transaction to be mined using publicClient
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setApproveLinkState('approved');
      // Force re-fetch of allowance
      refetchLinkAllowance();
    } catch (error) {
      setApproveLinkState('error');
      console.error("Error approving LINK:", error);
      alert("Failed to approve LINK.");
    }
  };

  // Reset approveLinkState if amount or address changes
  useEffect(() => {
    setApproveLinkState('idle');
  }, [formData.amount, connectedAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setContentHash(undefined); // Clear previous hash
    setGiftCreated(false);

    let currentContentHash: string | undefined = undefined;

    if (uploadedFile) {
      setIsEncrypting(true);
      try {
        const receiverPublicKey = formData.receiverPublicKey;
        if (!receiverPublicKey) throw new Error("Receiver public key is required for encryption.");

        const fileText = await uploadedFile.text();
        // Encrypt using MetaMask's public encryption key
        const encrypted = encrypt({
          publicKey: receiverPublicKey,
          data: fileText,
          version: 'x25519-xsalsa20-poly1305',
        });
        const encryptedString = Buffer.from(JSON.stringify(encrypted), 'utf8').toString('hex');
        setIsEncrypting(false);
        setIsUploading(true);
        const response = await fetch("/api/upload-private", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ encryptedContent: encryptedString, sender: connectedAddress, timestamp: new Date().toISOString() }),
        });
        if (!response.ok) {
          throw new Error("Failed to upload content to Pinata.");
        }
        const data = await response.json();
        currentContentHash = data.cid;
        setContentHash(data.cid);
        setIsUploading(false);
      } catch (encryptError) {
        console.error("Encryption or upload failed:", encryptError);
        alert("Failed to encrypt or upload content.");
        setIsEncrypting(false);
        setIsUploading(false);
        setIsCreating(false);
      }
    }

    // Calculate release timestamp
    const [year, month, day] = formData.releaseDate.split('-').map(Number);
    const releaseTimestamp: number = Math.floor(new Date(year, month - 1, day, 0, 0).getTime() / 1000);
    const amountInWei = parseEther(formData.amount);

    try {
      const receiverAddressAsAddress = formData.receiverAddress.startsWith("0x") 
        ? formData.receiverAddress as Address 
        : `0x${formData.receiverAddress}` as Address;

      // Contract call args: (address, uint256 releaseTimestamp, string contentHash, bool isLink, uint256 amount)
      const args = [
        receiverAddressAsAddress,
        releaseTimestamp,
        currentContentHash || "",
        formData.yieldOption !== "none",
        amountInWei,
      ];
      console.log("Call args:", args);
      setButtonState('creating');
      console.log("Calling writeContractAsync with args", args);
      setTxHash(undefined); // Reset txHash before new tx
      const tx = await writeContractAsync({
        abi: untilThenV1Abi,
        address: chainsToContracts[chainId].untilThenV1 as Address,
        functionName: "createGift",
        args,
        value: formData.yieldOption === "link" ? parseEther(fees.total.toString()) : amountInWei,
      });
      setTxHash(tx);
      setIsGiftTx(true);
      console.log("Set txHash:", tx);
    } catch (error) {
      setButtonState('error');
      console.error("Error sending transaction:", error);
      setTimeout(() => setButtonState('idle'), 5000);
      setIsGiftTx(false);
    }
  };

  useEffect(() => {
    if (txHash) {
      console.log("txHash changed:", txHash);
    }
  }, [txHash]);

  const isFormValid =
    formData.receiverAddress.trim() &&
    formData.receiverPublicKey.trim() &&
    formData.releaseDate.trim() &&
    formData.amount.trim() &&
    parseFloat(formData.amount.trim()) > 0;

  const isLinkApproved = 
    linkAllowance !== undefined && 
    linkAllowance !== null && 
    typeof linkAllowance === 'bigint' &&
    linkAllowance >= parseEther(formData.amount || "0");

  const showApproveLinkButton = formData.yieldOption === "link" && !isLinkApproved;

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
        {/* Receiver Public Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receiver Metamask Public Key. This will be used to encrypt the content, so the receiver only can read it.
          </label>
          <input
            type="text"
            value={formData.receiverPublicKey}
            onChange={(e) => setFormData(prev => ({ ...prev, receiverPublicKey: e.target.value }))}
            placeholder="Paste the receiver's public key here"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Release Date */}
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

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Content (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".txt"
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
                  Only .txt files allowed.
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
              { value: "eth", label: "ETH Yileld", desc: "Supply ETH to AAVE and earn APY" },
              { value: "link", label: "LINK Yield", desc: "Supply LINK to AAVE and earn APY" },
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
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="e.g., 0.001 ETH or 10 LINK"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                }
              }}
              onWheel={e => e.target instanceof HTMLElement && e.target.blur()}
            />
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
              {(uploadedFile) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Content Upload Fee:</span>
                  <span className="font-medium">{fees.contentUploadFee.toFixed(4)} ETH</span>
                </div>
              )}

              {formData.yieldOption !== "none" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    {/* No amount displayed when yield is chosen, only explanation */}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    When the yield option is chosen, a 10% of the amount + yield will be taken. If that is less, then 0.0001 ether is taken for eth yield and 0.05 ether for link yield.
                  </p>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee:</span>
                  <span className="font-medium">{fees.platformFee.toFixed(4)} ETH</span> {/* Show amount for no yield */}
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total Fees:</span>
                <span>{fees.total.toFixed(6)} ETH</span>
              </div>
              <div className="flex justify-between text-blue-600 font-medium">
                <span>Total ETH to send:</span>
                <span>
                  {formData.yieldOption === "link" ? fees.total.toFixed(4) : formatEther(parseEther(formData.amount))} ETH
                </span>
              </div>
              {(formData.yieldOption === "eth" || formData.yieldOption === "none") && (
                <p className="text-xs text-gray-500">Fees will be deducted from this amount.</p>
              )}
              {formData.yieldOption === "link" && (
                <div className="flex justify-between text-blue-600 font-medium mt-2">
                  <span>Total LINK to approve:</span>
                  <span>{parseFloat(formData.amount)} LINK</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showApproveLinkButton && (
          <button
            type="button"
            onClick={handleApproveLink}
            disabled={isCreating || approveLinkState === 'approving' || approveLinkState === 'approved'}
            className={`w-full py-3 px-4 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 flex items-center justify-center gap-2
              ${approveLinkState === 'approved' ? 'bg-green-600 text-white' :
                approveLinkState === 'approving' ? 'bg-yellow-500 text-white' :
                'bg-yellow-500 text-white hover:bg-yellow-600'}`}
          >
            {approveLinkState === 'approving' && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {approveLinkState === 'approved' ? 'LINK approved' :
              approveLinkState === 'approving' ? 'Approving LINK...' :
              'Approve LINK'}
          </button>
        )}

        <button
          type="submit"
          disabled={!isFormValid || buttonState === 'creating' || isUploading || isEncrypting || (formData.yieldOption === "link" && !isLinkApproved) || buttonState === 'created'}
          className={`w-full py-3 px-4 flex items-center justify-center gap-2 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
            ${buttonState === 'created' ? 'bg-green-600 text-white' :
              buttonState === 'error' ? 'bg-red-600 text-white' :
              (!isFormValid || buttonState === 'creating' || isUploading || isEncrypting || (formData.yieldOption === "link" && !isLinkApproved))
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed' :
                'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {(buttonState === 'creating' || isEncrypting || isUploading) && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {buttonState === 'created' ? "Gift Created" :
            buttonState === 'error' ? "Transaction Failed" :
            buttonState === 'creating' ? "Creating Gift..." :
            isEncrypting ? "Encrypting Content..." : 
            isUploading ? "Uploading Encrypted Content..." :
            "Create Gift"}
        </button>

      </form>
    </div>
  );
}
