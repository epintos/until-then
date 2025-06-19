import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import { ReactNode } from "react";
import { Providers } from "./providers";

// Suppress WalletConnect warnings and verbose logging
if (typeof window !== 'undefined') {
  // Suppress WalletConnect initialization warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('WalletConnect Core is already initialized')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export const metadata: Metadata = {
  title: "Until Then",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {props.children}
          <footer className="w-full mt-12 py-4 text-center text-xs text-gray-400 bg-transparent">
            © 2024 Until Then. All rights reserved.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
