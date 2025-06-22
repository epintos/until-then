'use client';
import ClaimedGifts from "@/components/ClaimedGifts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function ClaimedGiftsPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (!isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);
  return isConnected ? <ClaimedGifts /> : null;
} 
