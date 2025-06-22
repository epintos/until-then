'use client';
import SentGifts from "@/components/SentGifts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function SentGiftsPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (!isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);
  return isConnected ? <SentGifts /> : null;
} 
