'use client';
import ClaimedGifts from "@/components/ClaimedGifts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function ClaimedGiftsPage() {
  const { status } = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (status === "disconnected") {
      router.replace("/dashboard");
    }
  }, [status, router]);
  if (status === "connecting" || status === "reconnecting") {
    return null; // or a spinner
  }
  return status === "connected" ? <ClaimedGifts /> : null;
} 
