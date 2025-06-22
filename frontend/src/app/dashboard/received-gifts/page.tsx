'use client';
import ReceivedGifts from "@/components/ReceivedGifts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function ReceivedGiftsPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (!isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);
  return isConnected ? <ReceivedGifts /> : null;
} 
