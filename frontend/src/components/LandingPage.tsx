import { Clock } from "lucide-react";
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Send gifts through time with a decentralized solution. Schedule meaningful presents to be delivered at just the right moment in the future.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-4 gap-8 mb-16">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Time-Locked Gifts</h3>
          <p className="text-gray-600">
            Schedule gifts to be claimed at specific dates and times in the future.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Image src="/chainlink.png" alt="Chainlink" width={48} height={48} className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Secure & Decentralized</h3>
          <p className="text-gray-600">
            Built on Ethereum using Chainlink for ultimate security and transparency.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Image src="/pinata.svg" alt="Pinata IPFS" width={48} height={48} className="w-8 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Locked</h3>
          <p className="text-gray-600">
            Content is locked using Pinata Private IPFS.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
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
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="font-semibold mb-2">Create</h4>
            <p className="text-sm text-gray-600">
              Set up your gift with recipient, date, content and $
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="font-semibold mb-2">Lock</h4>
            <p className="text-sm text-gray-600">
              Gift is locked using Pinata private IPFS until release date
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h4 className="font-semibold mb-2">Grow</h4>
            <p className="text-sm text-gray-600">
              Optional yield generation increases gift value
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              4
            </div>
            <h4 className="font-semibold mb-2">Claim</h4>
            <p className="text-sm text-gray-600">
              Recipient claims gift as NFT when time arrives
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">5</div>
            <h4 className="font-semibold mb-2">Decrypt</h4>
            <p className="text-sm text-gray-600">Recipient decrypts the letter content using Metamask</p>
          </div>
        </div>
      </div>

      {/* Promotions Section */}
      <div className="mb-16">
        <div className="grid md:grid-cols-2 gap-6 justify-center items-center">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-8 text-white flex flex-col justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center mb-0 min-h-[48px]">
                <span className="flex items-center justify-center h-12 w-12 mr-3">
                  <Image src="/avalanche.png" alt="Avalanche" width={40} height={40} className="h-10 w-10 object-contain" />
                </span>
                <h3 className="text-xl font-bold whitespace-nowrap">Early Claimer Bonus</h3>
              </div>
              <p className="text-lg mb-0 font-semibold flex items-center gap-2 min-h-[56px] max-w-[28ch]">
                🪙 First 100 claims get a 500 UNTIL airdrop on Avalanche!
              </p>
            </div>
            <p className="opacity-90 min-h-[48px]">
              Be among the first to experience time-locked gifts and earn exclusive rewards.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-8 text-white flex flex-col justify-between h-full">
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center mb-0 min-h-[48px]">
                <span className="flex items-center justify-center h-12 w-12 mr-3 text-4xl">🎁</span>
                <h3 className="text-xl font-bold whitespace-nowrap">Weekly Avalanche Rewards</h3>
              </div>
              <p className="text-lg mb-0 font-semibold flex items-center gap-2 min-h-[56px] max-w-[28ch]">
                🎉 $100 weekly giveaway
              </p>
            </div>
            <p className="opacity-90 min-h-[48px]">
              Every gift claimer can participate in weekly giveaways worth $100 in ETH!
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Send Your First Gift?</h2>
        <p className="text-xl mb-8 opacity-90">
          {displayText}
        </p>
      </div>
    </div>
  );
}
