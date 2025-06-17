"use client";

import AppDashboard from "@/components/AppDashboard";
import LandingPage from "@/components/LandingPage";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function HomeContent() {
  const { isConnected } = useAccount();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    if (isConnected) {
      setHasStarted(true);
    }
  };

  if (!hasStarted) {
    return (
      <LandingPage 
        onStart={handleStart} 
        isConnected={isConnected} 
      />
    );
  }

  return <AppDashboard />;
}
