"use client";

import { useState } from "react";
import { useGame } from "@/lib/game-context";
import { POLYGON_CHAIN_ID } from "@/lib/web3";
import { Wallet, LogOut, ChevronRight, AlertCircle } from "lucide-react";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type WalletButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  preferWalletConnect?: boolean;
};

export default function WalletButton({
  variant = "secondary",
  preferWalletConnect,
}: WalletButtonProps) {
  const { wallet, connect, disconnect, switchNetwork } = useGame();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect(preferWalletConnect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to connect wallet");
    }
  };

  const isWrongNetwork =
    wallet.status === "connected" && wallet.chainId !== null && wallet.chainId !== POLYGON_CHAIN_ID;

  const buttonClass =
    variant === "primary"
      ? "fifa-button"
      : variant === "ghost"
        ? "bg-white/5 border border-white/10 text-white/60 hover:text-white px-4 py-2 font-heading uppercase italic transition-all rounded"
        : "fifa-button !bg-slate-800 !text-white";

  if (wallet.status === "connected" && wallet.address) {
    return (
      <div className="flex flex-col gap-2 items-end">
        <button 
          onClick={() => disconnect()}
          className="group relative flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 transition-all rounded"
        >
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Connected Wallet</span>
            <span className="font-heading text-white">{shortAddress(wallet.address)}</span>
          </div>
          <LogOut size={16} className="text-white/40 group-hover:text-red-400 transition-colors" />
        </button>
        
        {isWrongNetwork && (
          <button 
            onClick={() => switchNetwork()}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse"
          >
            <AlertCircle size={12} />
            Switch to Polygon
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <button 
        onClick={handleConnect}
        disabled={wallet.status === "connecting"}
        className={`${buttonClass} flex items-center gap-3 !px-6 !py-2 !text-sm`}
      >
        <Wallet size={16} />
        {wallet.status === "connecting" ? "Initializing..." : "Link ID"}
        <ChevronRight size={16} />
      </button>
      {error && (
        <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter max-w-[150px] text-right">
          {error}
        </span>
      )}
    </div>
  );
}
