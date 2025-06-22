'use client';
import CreateGift from "@/components/CreateGift";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function CreateGiftPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (!isConnected) {
      router.replace("/dashboard");
    }
  }, [isConnected, router]);
  return isConnected ? <CreateGift /> : null;
} 
