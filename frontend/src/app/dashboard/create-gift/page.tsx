'use client';
import CreateGift from "@/components/CreateGift";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function CreateGiftPage() {
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
  return status === "connected" ? <CreateGift /> : null;
} 
