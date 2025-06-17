import { Clock, Gift, Shield, Zap } from "lucide-react";
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="mb-6">
          <Gift className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Until Then
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Send gifts through time with Ethereum. Schedule meaningful presents 
            to be delivered at the perfect moment in the future.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Time-Locked Gifts</h3>
          <p className="text-gray-600">
            Schedule gifts to be revealed at specific dates and times in the future.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Secure & Decentralized</h3>
          <p className="text-gray-600">
            Built on Ethereum blockchain for ultimate security and transparency.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
          <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Yield Options</h3>
          <p className="text-gray-600">
            Choose from ETH or LINK yield generation while gifts are locked.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="font-semibold mb-2">Create</h4>
            <p className="text-sm text-gray-600">
              Set up your gift with recipient, date, and content
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="font-semibold mb-2">Lock</h4>
            <p className="text-sm text-gray-600">
              Gift is secured on blockchain until release date
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
        </div>
      </div>

      {/* Promotions Section */}
      <div className="mb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Gift className="w-8 h-8 mr-3" />
              <h3 className="text-2xl font-bold">Early Claimer Bonus</h3>
            </div>
            <p className="text-lg mb-2">
              🎉 <strong>First 100 claims get a $100 prize!</strong>
            </p>
            <p className="opacity-90">
              Be among the first to experience time-locked gifts and earn exclusive rewards.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Zap className="w-8 h-8 mr-3" />
              <h3 className="text-2xl font-bold">Weekly Avalanche Rewards</h3>
            </div>
            <p className="text-lg mb-2">
              🪙 <strong>500 UntilThen tokens weekly!</strong>
            </p>
            <p className="opacity-90">
              Every gift claimer can participate in weekly token giveaways on Avalanche.
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
        <button
          onClick={onStart}
          disabled={!isConnected}
          className={`px-8 py-4 text-lg font-semibold rounded-lg transition-all ${
            isConnected
              ? "bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          {isConnected ? "Start Creating Gifts" : "Connect Wallet First"}
        </button>
      </div>
    </div>
  );
}
