'use client';
import SentGifts from "@/components/SentGifts";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function SentGiftsPage() {
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
  return status === "connected" ? <SentGifts /> : null;
} 
