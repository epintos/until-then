import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Image src="/logo.png" alt="Until Then" height={32} width={120} className="h-8 w-auto object-contain rounded-lg" priority />
        </Link>
      </div>

      <ConnectButton showBalance={false} />
    </header>
  );
};

export default Header;
