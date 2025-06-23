'use client';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center py-4 px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/">
          <span className="text-2xl font-bold text-gray-900">Until Then</span>
        </Link>
      </div>
      {pathname === "/" ? (
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2 text-lg btn-primary"
        >
          Launch App
        </button>
      ) : (
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus || authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="btn-primary px-6 py-2 text-lg"
                  >
                    Connect Wallet
                  </button>
                ) : chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="btn-primary px-6 py-2 text-lg"
                  >
                    Wrong network
                  </button>
                ) : (
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="btn-primary px-6 py-2 text-lg"
                  >
                    {account.displayName}
                  </button>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      )}
    </header>
  );
};

export default Header;
