"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import CharacterCard from "@/components/CharacterCard";
import StatsPanel from "@/components/StatsPanel";
import TabSwitch from "@/components/TabSwitch";
import WalletButton from "@/components/WalletButton";
import { mapMetadataToCharacter, RawMetadata } from "@/lib/characters";
import { useGame } from "@/lib/game-context";
import { Character } from "@/lib/types";
import { fetchOwnedMetadata, fetchSampleMetadata, POLYGON_CHAIN_ID } from "@/lib/web3";
import { loadSelectedCharacter } from "@/lib/storage";
import { ChevronRight, Filter, Info, Loader2, History, Trophy, TrendingDown } from "lucide-react";

export default function SelectPage() {
  const { wallet, walletSession, progress, selectedCharacter, setSelectedCharacter } = useGame();
  const [tab, setTab] = useState("guest");
  const [walletCharacters, setWalletCharacters] = useState<Character[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [guestMetadata, setGuestMetadata] = useState<{ tokenId: string; data: RawMetadata }[]>([]);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const sampleCacheKey = "blitzbrawler:public-sample";

  const guestCharacters = useMemo(() => {
    return guestMetadata
      .map((entry) =>
        mapMetadataToCharacter(
          `public-${entry.tokenId}`,
          entry.data,
          "public",
          entry.tokenId,
          progress.upgrades
        )
      )
      .slice(0, 12);
  }, [guestMetadata, progress.upgrades]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem(sampleCacheKey);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as { tokenId: string; data: RawMetadata }[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGuestMetadata(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const saved = loadSelectedCharacter(wallet.address);
    if (saved && !selectedCharacter) {
      const found = [...guestCharacters, ...walletCharacters].find((char) => char.id === saved);
      if (found) {
        setSelectedCharacter(found);
      }
    }
  }, [guestCharacters, walletCharacters, selectedCharacter, setSelectedCharacter, wallet.address]);

  useEffect(() => {
    let mounted = true;
    const loadGuestCharacters = async () => {
      if (tab !== "guest") return;
      setLoadingGuest(true);
      setGuestError(null);
      try {
        const metadata = await fetchSampleMetadata(12);
        if (mounted) {
          setGuestMetadata(metadata);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(sampleCacheKey, JSON.stringify(metadata));
          }
        }
      } catch (error: unknown) {
        if (mounted) {
          setGuestError(error instanceof Error ? error.message : "Unable to load live NFTs");
        }
      } finally {
        if (mounted) {
          setLoadingGuest(false);
        }
      }
    };
    loadGuestCharacters();
    return () => {
      mounted = false;
    };
  }, [tab]);

  useEffect(() => {
    let mounted = true;
    const loadWalletCharacters = async () => {
      if (!walletSession || wallet.status !== "connected") return;
      if (wallet.chainId !== POLYGON_CHAIN_ID) return;
      setLoadingWallet(true);
      setWalletError(null);
      try {
        const metadata = await fetchOwnedMetadata(walletSession.provider, wallet.address as string);
        const mapped = metadata.slice(0, 10).map(({ tokenId, data }) =>
          mapMetadataToCharacter(`wallet-${tokenId}`, data, "wallet", tokenId, progress.upgrades)
        );
        if (mounted) {
          setWalletCharacters(mapped);
        }
      } catch (error: unknown) {
        if (mounted) {
          setWalletError(error instanceof Error ? error.message : "Unable to load NFTs");
        }
      } finally {
        if (mounted) {
          setLoadingWallet(false);
        }
      }
    };
    if (tab === "wallet") {
      loadWalletCharacters();
    }
    return () => {
      mounted = false;
    };
  }, [tab, walletSession, wallet.status, wallet.chainId, wallet.address, progress.upgrades]);

  const characters = tab === "guest" ? guestCharacters : walletCharacters;

  return (
    <main className="min-h-screen pb-24 md:pb-0 text-white">
      <TopNav />
      
      <section className="max-w-7xl mx-auto px-4 py-8 animate-entrance">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-10 bg-brand-gold" />
              <span className="text-xs font-bold text-brand-gold uppercase tracking-[0.3em]">
                Squad Selection
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading uppercase italic tracking-tighter leading-none">
              Build your <span className="text-brand-gold">Ultimate</span> Team
            </h1>
          </div>
          
          <div className="w-full md:w-auto">
            <TabSwitch
              value={tab}
              onChange={setTab}
              options={[
                { key: "guest", label: "Public Market" },
                { key: "wallet", label: "My Collection" },
                { key: "history", label: "Match Logs" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            
            {tab === "history" && (
              <div className="space-y-4">
                {progress.history && progress.history.length > 0 ? (
                  progress.history.map((entry) => (
                    <div key={entry.id} className="fifa-panel flex items-center justify-between group hover:border-brand-gold/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`p-3 rounded bg-white/5 ${
                          entry.winner === "player" ? "text-brand-gold" : 
                          entry.winner === "ai" ? "text-red-400" : "text-slate-400"
                        }`}>
                          {entry.winner === "player" ? <Trophy size={24} /> : 
                           entry.winner === "ai" ? <TrendingDown size={24} /> : <History size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading italic uppercase text-lg">{entry.characterName}</span>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold uppercase tracking-widest ${
                              entry.winner === "player" ? "text-brand-gold" : "text-white/40"
                            }`}>
                              {entry.winner === "player" ? "Victory" : entry.winner === "ai" ? "Defeat" : "Draw"}
                            </span>
                            <span className="text-white/20">•</span>
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">
                              Tactic: {entry.tactic}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mb-1">Score</div>
                          <div className="text-2xl font-heading italic">{entry.playerScore} - {entry.aiScore}</div>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mb-1">XP</div>
                          <div className="text-xl font-heading text-brand-gold italic">+{entry.xpEarned}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="fifa-panel text-center py-20">
                    <History size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-2xl font-heading uppercase italic">No history yet</h3>
                    <p className="text-slate-500">Complete matches to see your career progress here.</p>
                  </div>
                )}
              </div>
            )}

            {tab === "wallet" && wallet.status !== "connected" && (
              <div className="fifa-panel flex flex-col items-center text-center gap-6 py-12">
                <div className="bg-white/5 p-6 rounded-full">
                  <Info size={48} className="text-brand-gold" />
                </div>
                <div>
                  <h2 className="text-3xl font-heading uppercase italic mb-2">Wallet Disconnected</h2>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    Connect your wallet to unlock your exclusive NFT roster and premium stat bonuses.
                  </p>
                </div>
                <WalletButton variant="primary" />
              </div>
            )}

            {(loadingGuest || loadingWallet) && characters.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 opacity-40 pointer-events-none">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[2/3] bg-slate-800 animate-pulse rounded-lg" />
                ))}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <Loader2 size={48} className="animate-spin text-brand-gold" />
                </div>
              </div>
            )}

            {(guestError || walletError) && (
               <div className="fifa-panel border-red-500/50 text-center py-6 mb-6">
                  <p className="text-red-400 font-bold uppercase tracking-widest text-xs">
                     Load Warning: {guestError || walletError}
                  </p>
               </div>
            )}

            {!loadingGuest && !loadingWallet && characters.length === 0 && (
              <div className="fifa-panel text-center py-20">
                <Filter size={48} className="mx-auto text-slate-700 mb-4" />
                <h3 className="text-2xl font-heading uppercase italic">No players found</h3>
                <p className="text-slate-500">Try adjusting your filters or switching collections.</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  selected={selectedCharacter?.id === character.id}
                  onSelect={setSelectedCharacter}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 sticky top-24 h-fit">
            <StatsPanel character={selectedCharacter} />
            
            {selectedCharacter && (
              <div className="mt-6 space-y-4">
                <Link
                  href="/match"
                  className="fifa-button w-full flex items-center justify-center gap-2 group"
                >
                  Confirm Squad
                  <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/upgrade"
                  className="block text-center text-xs font-bold text-white/40 uppercase hover:text-white transition-colors tracking-widest"
                >
                  Improve Team Chemistry & Skills
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
