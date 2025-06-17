"use client";

import ClaimedGifts from "@/components/ClaimedGifts";
import CreateGift from "@/components/CreateGift";
import ReceivedGifts from "@/components/ReceivedGifts";
import SentGifts from "@/components/SentGifts";
import { Crown, Gift, Inbox, Send } from "lucide-react";
import { useState } from "react";

type TabType = "create" | "sent" | "received" | "claimed";

const tabs = [
  { id: "create" as TabType, name: "Create Gift", icon: Gift },
  { id: "sent" as TabType, name: "Sent Gifts", icon: Send },
  { id: "received" as TabType, name: "Received Gifts", icon: Inbox },
  { id: "claimed" as TabType, name: "Claimed Gifts", icon: Crown },
];

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("create");

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return <CreateGift />;
      case "sent":
        return <SentGifts />;
      case "received":
        return <ReceivedGifts />;
      case "claimed":
        return <ClaimedGifts />;
      default:
        return <CreateGift />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
