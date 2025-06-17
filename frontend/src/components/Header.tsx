import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Until Then</h1>
      </div>

      <ConnectButton />
    </header>
  );
};

export default Header;
