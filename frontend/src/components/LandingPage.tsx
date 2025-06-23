import { Calendar, Gift } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LandingPageProps {
  onStart: () => void;
  isConnected: boolean;
}

export default function LandingPage({ onStart, isConnected }: LandingPageProps) {
  const [displayText, setDisplayText] = useState("Connect your wallet to begin sending gifts through time.");

  useEffect(() => {
    if (isConnected) {
      setDisplayText("You're all set! Start creating time-locked gifts now.");
    } else {
      setDisplayText("Connect your wallet to begin sending gifts through time.");
    }
  }, [isConnected]); // Update when isConnected changes

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <p className="text-5xl md:text-5xl font-extrabold text-black max-w-3xl mx-auto leading-tight">
            Send gifts through time with a<br />decentralized solution.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-4 gap-8 mb-16">
        <div className="card text-center p-6 rounded-lg shadow-sm">
          <Calendar className="w-12 h-12 text-black mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Time-Locked Gifts</h3>
          <p className="text-gray-600">
            Schedule gifts to be claimed at specific dates and times in the future.
          </p>
        </div>
        
        <div className="card text-center p-6 rounded-lg shadow-sm">
          <Image src="/chainlink.png" alt="Chainlink" width={48} height={48} className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Trustless by design</h3>
          <p className="text-gray-600">
            Built on Ethereum using Chainlink for ultimate security and transparency.
          </p>
        </div>
        
        <div className="card text-center p-6 rounded-lg shadow-sm">
          <Image src="/pinata.svg" alt="Pinata IPFS" width={48} height={48} className="w-8 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Locked</h3>
          <p className="text-gray-600">
            Content is locked using Pinata Private IPFS.
          </p>
        </div>
        
        <div className="card text-center p-6 rounded-lg shadow-sm">
          <Image src="/aave.png" alt="Aave" width={48} height={48} className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Yield Options</h3>
          <p className="text-gray-600">
            Choose from ETH or LINK yield generation while gifts are locked.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          How it works
        </h2>
        <div className="grid md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#24584D] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="font-semibold mb-2">Create</h4>
            <p className="text-sm text-gray-600">
              Set your gift with a recipient, date, message, and amount.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#24584D] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="font-semibold mb-2">Lock</h4>
            <p className="text-sm text-gray-600">
              Gift is locked using Pinata private IPFS until release date.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#24584D] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h4 className="font-semibold mb-2">Grow</h4>
            <p className="text-sm text-gray-600">
              Optional yield generation increases gift value
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#24584D] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              4
            </div>
            <h4 className="font-semibold mb-2">Claim</h4>
            <p className="text-sm text-gray-600">
              Recipient claims gift as NFT when time arrives
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#24584D] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">5</div>
            <h4 className="font-semibold mb-2">Decrypt</h4>
            <p className="text-sm text-gray-600">Recipient decrypts the letter content using Metamask</p>
          </div>
        </div>
      </div>

      {/* Promotions Section */}
      <div className="mb-16">
        <div className="grid md:grid-cols-2 gap-8 justify-center items-center">
          {/* Early Claimer Bonus */}
          <div className="bg-[#FCF7F3] rounded-2xl p-8 flex gap-6 shadow-sm items-center">
            <span className="flex items-center justify-center w-16 h-16">
              <Image src="/avalanche.png" alt="Avalanche" width={48} height={48} className="w-12 h-12 object-contain" />
            </span>
            <div className="flex-1">
              <div className="text-xl font-bold text-[#2B2B2B] mb-1 leading-tight">Early Claimer Bonus</div>
              <div className="text-lg text-[#2B2B2B] font-normal leading-snug">
                First 100 claims get a 500 UNTIL<br />airdrop on <span className="font-bold">Avalanche!</span>
              </div>
            </div>
          </div>
          {/* Weekly Avalanche Rewards */}
          <div className="bg-[#FCF7F3] rounded-2xl p-8 flex gap-6 shadow-sm items-center">
            <span className="flex items-center justify-center w-16 h-16">
              <Gift className="w-12 h-12 text-[#2B2B2B]" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <div className="text-xl font-bold text-[#2B2B2B] mb-1 leading-tight">Weekly Avalanche Rewards</div>
              <div className="text-lg text-[#2B2B2B] font-normal leading-snug">
                Participate in weekly giveaways<br />worth <span className="font-bold">$100 in ETH!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="w-screen left-0 right-0 py-20 bg-[#2B2B2B] flex flex-col items-center justify-center" style={{ position: 'relative', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-8">Ready to Send Your First Gift?</h2>
        <button
          onClick={onStart}
          className="btn-primary px-10 py-4 text-lg font-bold"
        >
          Launch App
        </button>
      </div>
    </div>
  );
}
