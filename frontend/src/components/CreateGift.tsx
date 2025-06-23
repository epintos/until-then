"use client";

import { encrypt } from '@metamask/eth-sig-util';
import { BrowserProvider, Contract } from "ethers";
import { Calendar, Info, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Address, formatEther, parseEther } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { chainsToContracts, erc20Abi, untilThenV1Abi } from "../constants";

type YieldOption = "none" | "eth" | "link";

export default function CreateGift() {
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
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [buttonState, setButtonState] = useState<'idle' | 'creating' | 'created' | 'error'>('idle');
  const [isGiftTx, setIsGiftTx] = useState(false);
  const { isSuccess, isError, error: txError } = useWaitForTransactionReceipt({ hash: txHash });
  const [approveLinkState, setApproveLinkState] = useState<'idle' | 'approving' | 'approved' | 'error'>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'encrypting' | 'uploading' | 'creating' | 'done' | 'error' | 'wallet' | null>(null);
  const [modalError, setModalError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [lastSubmitArgs, setLastSubmitArgs] = useState<any>(null);
  const [giftId, setGiftId] = useState<string | null>(null);

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

  useEffect(() => {
    if (linkAllowance !== undefined && linkAllowance !== null && typeof linkAllowance === 'bigint' && linkAllowance >= parseEther(formData.amount || "0")) {
      refetchLinkAllowance();
    }
  }, [linkAllowance, refetchLinkAllowance, formData.amount]);

  useEffect(() => {
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
  }, [isSuccess, isError, txError, isGiftTx, buttonState]);

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
      // Only log error, do not show alert
      console.error('No public client available for transaction confirmation.');
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
      // Only log error, do not show alert
      console.error("Error approving LINK:", error);
    }
  };

  // Reset approveLinkState if amount or address changes
  useEffect(() => {
    setApproveLinkState('idle');
  }, [formData.amount, connectedAddress]);

  // Helper to reset form
  const resetForm = () => {
    setFormData({
      receiverAddress: "",
      receiverPublicKey: "",
      releaseDate: "",
      amount: "",
      yieldOption: formData.yieldOption, // keep yield option
    });
    setUploadedFile(null);
    setButtonState('idle');
    setTxHash(undefined);
  };

  // Modal progress effect
  useEffect(() => {
    if (!modalOpen) {
      setProgress(0);
      return;
    }
    let interval: NodeJS.Timeout | undefined;
    if (modalStep === 'encrypting') {
      setProgress(0);
      let p = 0;
      interval = setInterval(() => {
        p += 100 / 30;
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(interval);
      }, 100);
    } else if (modalStep === 'uploading') {
      setProgress(0);
      let p = 0;
      interval = setInterval(() => {
        p += 100 / 30;
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(interval);
      }, 100);
    } else if (modalStep === 'creating') {
      setProgress(0);
      let p = 0;
      interval = setInterval(() => {
        p += 100 / 1800; // 120 seconds
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(interval);
      }, 100);
    } else if (modalStep === 'done') {
      setProgress(100);
    } else if (modalStep === 'wallet') {
      setProgress(0);
      let p = 0;
      interval = setInterval(() => {
        p += 100 / 30;
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(interval);
      }, 100);
    }
    return () => interval && clearInterval(interval);
  }, [modalOpen, modalStep]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLastSubmitArgs({}); // No args, but allows retry
    setModalOpen(true);
    setModalStep('encrypting');
    setModalError("");
    setIsCreating(true);
    setGiftId(null);
    let currentContentHash: string | undefined = undefined;
    try {
      if (uploadedFile) {
        setModalStep('encrypting');
        const receiverPublicKey = formData.receiverPublicKey;
        if (!receiverPublicKey) throw new Error("Receiver public key is required for encryption.");
        const fileText = await uploadedFile.text();
        const encrypted = encrypt({
          publicKey: receiverPublicKey,
          data: fileText,
          version: 'x25519-xsalsa20-poly1305',
        });
        const encryptedString = Buffer.from(JSON.stringify(encrypted), 'utf8').toString('hex');
        setModalStep('uploading');
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
      }
      setModalStep('wallet');
      // Calculate release timestamp
      const [year, month, day] = formData.releaseDate.split('-').map(Number);
      const releaseTimestamp: number = Math.floor(new Date(year, month - 1, day, 0, 0).getTime() / 1000);
      const amountInWei = parseEther(formData.amount);
      const receiverAddressAsAddress = formData.receiverAddress.startsWith("0x") 
        ? formData.receiverAddress as Address 
        : `0x${formData.receiverAddress}` as Address;
      const args = [
        receiverAddressAsAddress,
        releaseTimestamp,
        currentContentHash || "",
        formData.yieldOption !== "none",
        formData.yieldOption === "link" ? amountInWei: 0,
      ];
      setTxHash(undefined);
      // Wait for wallet confirmation
      const tx = await writeContractAsync({
        abi: untilThenV1Abi,
        address: chainsToContracts[chainId].untilThenV1 as Address,
        functionName: "createGift",
        args,
        value: formData.yieldOption === "link" ? parseEther(fees.total.toString()) : amountInWei,
      });
      setModalStep('creating');
      setTxHash(tx);
      // Wait for GiftCreated event
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(chainsToContracts[chainId].untilThenV1, untilThenV1Abi, provider);
      const filter = contract.filters.GiftCreated(connectedAddress, receiverAddressAsAddress);
      const giftIdFromEvent = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timed out waiting for GiftCreated event')), 120000);
        contract.once(filter, (eventPayload) => {
          clearTimeout(timeout);
          let giftId;
          if (eventPayload && typeof eventPayload === 'object' && 'args' in eventPayload && Array.isArray(eventPayload.args)) {
            giftId = eventPayload.args[2];
          } else {
            giftId = eventPayload[2];
          }
          let id;
          if (typeof giftId === 'bigint') {
            id = giftId.toString();
          } else if (typeof giftId === 'string') {
            id = giftId;
          } else if (giftId && typeof giftId === 'object' && 'toString' in giftId && typeof giftId.toString === 'function') {
            id = giftId.toString();
          } else {
            id = String(giftId);
          }
          setGiftId(id);
          resolve(id);
        });
      });
      setModalStep('done');
      setIsGiftTx(true);
    } catch (error: any) {
      setModalStep('error');
      setModalError('Something went wrong. Please try again.');
      console.error(error);
      setIsCreating(false);
      setIsGiftTx(false);
    }
  };

  const isFormValid =
    formData.receiverAddress.trim() &&
    formData.receiverPublicKey.trim() &&
    formData.releaseDate.trim() &&
    formData.amount.trim() &&
    parseFloat(formData.amount.trim()) > 0 &&
    // For no yield and eth yield, ensure amount is at least the total fees
    (formData.yieldOption === "link" || parseFloat(formData.amount.trim()) >= fees.total);

  const isLinkApproved = 
    linkAllowance !== undefined && 
    linkAllowance !== null && 
    typeof linkAllowance === 'bigint' &&
    linkAllowance >= parseEther(formData.amount || "0");

  const showApproveLinkButton =
    formData.yieldOption === "link" &&
    linkAllowance !== undefined &&
    linkAllowance !== null &&
    !isLinkApproved;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Gift</h1>
        <p className="text-gray-600">
          Set up a time-locked gift to be delivered in a specific date
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
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            Receiver Metamask Public Key
            <span className="relative group">
              <Info className="w-4 h-4 text-blue-500 inline-block align-middle cursor-pointer" />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-96 bg-gray-800 text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-lg">
                The provided key will be used to encrypt the content, ensuring that only the intended receiver can read it.
              </span>
            </span>
          </label>
          <input
            type="text"
            value={formData.receiverPublicKey}
            onChange={(e) => setFormData(prev => ({ ...prev, receiverPublicKey: e.target.value }))}
            placeholder="Paste the receiver&apos;s public key here"
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
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            Upload Content (Optional)
            <span className="relative group">
              <Info className="w-4 h-4 text-blue-500 inline-block align-middle cursor-pointer" />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-96 bg-gray-800 text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-lg">
                The encrypted content will be uploaded to Pinata&apos;s private IPFS, allowing the receiver to access it only after the specified release date.
              </span>
            </span>
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
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
            Yield Option
            <span className="relative group">
              <Info className="w-4 h-4 text-blue-500 inline-block align-middle cursor-pointer" />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-96 bg-gray-800 text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-lg">
                You can choose to deposit the gift amount into a yield strategy. This allows the receiver to potentially receive a larger amount in the future, depending on the current APY of the selected currency on Aave. Note that this option involves additional risk.
              </span>
            </span>
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
                  <div className="font-medium text-gray-900 flex items-center gap-1">
                    {option.label}
                    {option.value === 'link' && (
                      <span className="relative group">
                        <Info className="w-4 h-4 text-blue-500 inline-block align-middle cursor-pointer" />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-96 bg-gray-800 text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-lg">
                          On Sepolia (for testing), you&apos;ll need LINK tokens compatible with Aave. You can obtain them from: https://app.aave.com/faucet/
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            Amount
            <span className="relative group">
              <Info className="w-4 h-4 text-blue-500 inline-block align-middle cursor-pointer" />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-96 bg-gray-800 text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none shadow-lg">
                This is the amount the receiver will receive when claiming the gift. Depending on the selected options and applicable fees, the final amount may be slightly lower than the value entered here.
              </span>
            </span>
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
                  When the yield option is selected, a fee is applied: 10% of the earned yield or a minimum of 0.001 ETH (for ETH yield) or 0.05 LINK (for LINK yeld), whichever is greater.
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
              {/* Show error if amount is insufficient for fees */}
              {(formData.yieldOption === "none" || formData.yieldOption === "eth") && 
               parseFloat(formData.amount) > 0 && 
               parseFloat(formData.amount) < fees.total && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  ⚠️ Amount must be at least {fees.total.toFixed(6)} ETH to cover fees
                </div>
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
            className={
              approveLinkState === 'approving'
                ? 'w-full py-3 px-4 btn-third flex items-center justify-center gap-2'
                : 'w-full py-3 px-4 btn-secondary flex items-center justify-center gap-2'
            }
          >
            {approveLinkState === 'approving' && (
              <svg className="animate-spin h-5 w-5" style={{ color: '#816EE2' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {approveLinkState === 'approved'
              ? 'LINK approved'
              : approveLinkState === 'approving'
              ? 'Approving LINK...'
              : 'Approve LINK'}
          </button>
        )}

        <button
          type="submit"
          disabled={!isFormValid || buttonState === 'creating' || isUploading || isEncrypting || (formData.yieldOption === "link" && !isLinkApproved) || buttonState === 'created'}
          className={`w-full py-3 px-4 flex items-center justify-center gap-2 btn-primary
            ${buttonState === 'created' ? 'bg-green-600 text-white' :
              buttonState === 'error' ? 'bg-red-600 text-white' :
              (!isFormValid || buttonState === 'creating' || isUploading || isEncrypting || (formData.yieldOption === "link" && !isLinkApproved))
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed' :
                ''}`}
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

      {/* Modal for create gift progress */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-0 bg-transparent shadow-none border-none"
              style={{ background: 'none' }}
              onClick={() => { setModalOpen(false); if (modalStep === 'done') resetForm(); }}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Create Gift</h2>
            {modalStep === 'error' ? (
              <>
                <div className="mb-4 w-full text-center text-red-600 font-semibold">Something went wrong. Please try again.</div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 btn-primary rounded"
                    onClick={() => { setModalOpen(false); setTimeout(() => handleSubmit(), 100); }}
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
            ) : modalStep === 'done' ? (
              <>
                <div className="mb-4 w-full text-center text-green-600 font-semibold">Gift created successfully!{giftId && (<><br/>Gift ID: <span className="font-bold">{giftId}</span></>)}</div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 btn-primary rounded"
                    onClick={() => { setModalOpen(false); resetForm(); }}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    {modalStep === 'encrypting' && (
                      <><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#816EE2' }}></span><span>Encrypting Content...</span></> )}
                    {modalStep === 'uploading' && (
                      <><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#816EE2' }}></span><span>Uploading Encrypted Content...</span></> )}
                    {modalStep === 'wallet' && (
                      <><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#816EE2' }}></span><span>Waiting for wallet confirmation...</span></> )}
                    {modalStep === 'creating' && (
                      <><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#816EE2' }}></span><span>Creating Gift...</span></> )}
                  </div>
                  {/* Progress Bar */}
                  {(modalStep !== 'wallet') && (
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: '#816EE2' }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
