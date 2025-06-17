"use client";

import { Crown, Gift, Inbox, Send } from "lucide-react";
import Link from "next/link";

const tabs = [
  { id: "create", name: "Create Gift", icon: Gift, href: "/dashboard/create-gift" },
  { id: "sent", name: "Sent Gifts", icon: Send, href: "/dashboard/sent-gifts" },
  { id: "received", name: "Received Gifts", icon: Inbox, href: "/dashboard/received-gifts" },
  { id: "claimed", name: "Claimed Gifts", icon: Crown, href: "/dashboard/claimed-gifts" },
];

export default function AppDashboard() {
  return (
    <div className="w-64 bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
