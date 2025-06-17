import AppDashboard from "@/components/AppDashboard";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8 max-w-7xl mx-auto px-6 py-8">
      <AppDashboard />
      <div className="flex-1 bg-white rounded-lg shadow-sm border p-8">
        {children}
      </div>
    </div>
  );
} 
