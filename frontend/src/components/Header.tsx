import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

const Header = () => {
  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/">
          <span className="text-2xl font-bold text-gray-900">Until Then</span>
        </Link>
      </div>

      <ConnectButton showBalance={false} />
    </header>
  );
};

export default Header;
