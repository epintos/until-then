'use client';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/">
          <span className="text-2xl font-bold text-gray-900">Until Then</span>
        </Link>
      </div>
      {pathname === "/" ? (
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          Launch App
        </button>
      ) : (
        <ConnectButton showBalance={false} />
      )}
    </header>
  );
};

export default Header;
