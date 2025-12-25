"use client";

import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { BrowserProvider } from 'ethers';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Character,
  MatchResult,
  Progress,
  WalletState,
} from "./types";
import {
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

function Web3ModalSync({ 
  setWallet, 
  setWalletSession,
  setModalInstance 
}: { 
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>,
  setWalletSession: React.Dispatch<React.SetStateAction<WalletSession | null>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setModalInstance: (modal: any) => void
}) {
  const modal = useWeb3Modal()
  const { address, isConnected, chainId } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  useEffect(() => {
    setModalInstance(modal)
  }, [modal, setModalInstance])

  useEffect(() => {
    if (isConnected && address && walletProvider) {
      const provider = new BrowserProvider(walletProvider)
      setWallet({
        address,
        chainId: chainId || null,
        status: "connected",
        providerType: "walletconnect"
      })
      setWalletSession({
        address,
        chainId: chainId || 0,
        provider,
        rawProvider: walletProvider,
        providerType: "walletconnect"
      })
    } else {
      setWallet({
        address: null,
        chainId: null,
        status: "disconnected",
        providerType: null
      })
      setWalletSession(null)
    }
  }, [isConnected, address, chainId, walletProvider, setWallet, setWalletSession])

  return null
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    status: "disconnected",
    providerType: null,
  });
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modalRef = useRef<any>(null);

  const [progress, setProgress] = useState<Progress>(defaultProgress());
  const [selectedCharacter, setSelectedCharacterState] = useState<Character | null>(null);
  const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setModalInstance = useCallback((modal: any) => {
    modalRef.current = modal;
  }, []);

  const connect = useCallback(async () => {
    try {
      await modalRef.current?.open();
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await modalRef.current?.open({ view: 'Account' })
  }, []);

  const switchNetwork = useCallback(async () => {
    await modalRef.current?.open({ view: 'Networks' })
  }, []);

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
    [wallet, walletSession, progress, selectedCharacter, lastMatch, connect, switchNetwork, disconnect]
  );

  return (
    <GameContext.Provider value={value}>
      {mounted && (
        <Web3ModalSync 
          setWallet={setWallet} 
          setWalletSession={setWalletSession} 
          setModalInstance={setModalInstance} 
        />
      )}
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
