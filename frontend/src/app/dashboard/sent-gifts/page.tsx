'use client';
import SentGifts from "@/components/SentGifts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function SentGiftsPage() {
  const { status } = useAccount();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  useEffect(() => {
    if (hasMounted && status === "disconnected") {
      router.replace("/dashboard");
    }
  }, [status, router, hasMounted]);
  if (!hasMounted || status === "connecting" || status === "reconnecting") {
    return null; // or a spinner
  }
  return status === "connected" ? <SentGifts /> : null;
} 
