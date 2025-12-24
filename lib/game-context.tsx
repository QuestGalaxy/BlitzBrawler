"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Character,
  MatchResult,
  Progress,
  WalletState,
} from "./types";
import {
  connectWallet,
  disconnectWallet,
  switchNetwork as web3SwitchNetwork,
  WalletSession,
} from "./web3";
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  saveSelectedCharacter,
} from "./storage";
import { getLevelFromXp } from "./traits";

type GameContextValue = {
  wallet: WalletState;
  walletSession: WalletSession | null;
  connect: (preferWalletConnect?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;
  lastMatch: MatchResult | null;
  setLastMatch: React.Dispatch<React.SetStateAction<MatchResult | null>>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    status: "disconnected",
    providerType: null,
  });
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  const [progress, setProgress] = useState<Progress>(defaultProgress());
  const [selectedCharacter, setSelectedCharacterState] = useState<Character | null>(null);
  const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    const saved = loadProgress(wallet.address);
    setProgress({ ...saved, level: getLevelFromXp(saved.xp) });
    setSelectedCharacterState(null);
  }, [wallet.address]);

  useEffect(() => {
    saveProgress(progress, wallet.address);
  }, [progress, wallet.address]);

  useEffect(() => {
    if (selectedCharacter) {
      saveSelectedCharacter(selectedCharacter.id, wallet.address);
    }
  }, [selectedCharacter, wallet.address]);

  useEffect(() => {
    if (!walletSession?.rawProvider?.on) return;
    const handleAccounts = (accounts: unknown) => {
      const accs = accounts as string[];
      if (!accs || accs.length === 0) {
        setWallet({
          address: null,
          chainId: null,
          status: "disconnected",
          providerType: null,
        });
        setWalletSession(null);
      } else {
        setWallet((prev) => ({ ...prev, address: accs[0] }));
      }
    };
    const handleChain = (chainId: unknown) => {
      const numeric = Number(chainId);
      setWallet((prev) => ({ ...prev, chainId: Number.isNaN(numeric) ? prev.chainId : numeric }));
    };

    walletSession.rawProvider.on("accountsChanged", handleAccounts);
    walletSession.rawProvider.on("chainChanged", handleChain);

    return () => {
      walletSession.rawProvider.removeListener?.("accountsChanged", handleAccounts);
      walletSession.rawProvider.removeListener?.("chainChanged", handleChain);
    };
  }, [walletSession]);

  const connect = async (preferWalletConnect?: boolean) => {
    setWallet((prev) => ({ ...prev, status: "connecting" }));
    try {
      const session = await connectWallet(preferWalletConnect);
      setWalletSession(session);
      setWallet({
        address: session.address,
        chainId: session.chainId,
        status: "connected",
        providerType: session.providerType,
      });
    } catch (error) {
      setWallet((prev) => ({ ...prev, status: "disconnected" }));
      throw error;
    }
  };

  const disconnect = async () => {
    if (walletSession?.rawProvider) {
      await disconnectWallet(walletSession.rawProvider);
    }
    setWallet({
      address: null,
      chainId: null,
      status: "disconnected",
      providerType: null,
    });
    setWalletSession(null);
  };

  const switchNetwork = async () => {
    if (walletSession?.rawProvider) {
      await web3SwitchNetwork(walletSession.rawProvider);
    }
  };

  const setSelectedCharacter = (character: Character | null) => {
    setSelectedCharacterState(character);
  };

  const value = useMemo(
    () => ({
      wallet,
      walletSession,
      connect,
      disconnect,
      switchNetwork,
      progress,
      setProgress,
      selectedCharacter,
      setSelectedCharacter,
      lastMatch,
      setLastMatch,
    }),
    [wallet, walletSession, progress, selectedCharacter, lastMatch, switchNetwork, disconnect]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}