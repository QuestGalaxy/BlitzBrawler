"use client";

import TopNav from "@/components/TopNav";
import { useGame } from "@/lib/game-context";
import { getUpgradePoints, getXpForNextLevel } from "@/lib/traits";
import { Zap, Shield, Wind, Activity, Check, Lock, ChevronRight, TrendingUp } from "lucide-react";

const STADIUM_OPTIONS = [
  "Neon Wave",
  "Crimson Burst",
  "Aurora Pulse",
  "Solar Flare",
  "Quantum Mist",
];

export default function UpgradePage() {
  const { progress, setProgress } = useGame();
  const xpInfo = getXpForNextLevel(progress.xp);
  const totalPoints = getUpgradePoints(progress.xp);
  const spentPoints =
    progress.upgrades.power +
    progress.upgrades.speed +
    progress.upgrades.strength +
    progress.upgrades.agility;
  const availablePoints = Math.max(totalPoints - spentPoints, 0);
  const progressPercent = Math.min((xpInfo.currentLevelXp / xpInfo.nextLevelXp) * 100, 100);

  const upgradeStat = (key: "power" | "speed" | "strength" | "agility") => {
    if (availablePoints <= 0) return;
    setProgress((prev) => ({
      ...prev,
      upgrades: {
        ...prev.upgrades,
        [key]: prev.upgrades[key] + 1,
      },
    }));
  };

  const setStadiumFx = (value: string) => {
    setProgress((prev) => ({
      ...prev,
      upgrades: {
        ...prev.upgrades,
        stadiumFx: value,
      },
    }));
  };

  return (
    <main className="min-h-screen pb-24 md:pb-0 text-white">
      <TopNav />
      <section className="max-w-7xl mx-auto px-4 py-8 animate-entrance">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-10 bg-brand-gold" />
              <span className="text-xs font-bold text-brand-gold uppercase tracking-[0.3em]">
                Management Center
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading uppercase italic tracking-tighter leading-none">
              Team <span className="text-brand-gold">Optimization</span>
            </h1>
          </div>
          
          <div className="fifa-panel py-3 px-6 flex items-center gap-4 border-brand-gold/30">
             <div className="text-right">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Available Points</div>
                <div className="text-3xl font-heading text-brand-gold italic leading-none">{availablePoints}</div>
             </div>
             <div className="bg-brand-gold/10 p-2 rounded">
                <TrendingUp size={24} className="text-brand-gold" />
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-8">
            
            <div className="fifa-panel group overflow-hidden">
               <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em] mb-1">Season Progress</div>
                    <div className="text-4xl font-heading italic leading-none">Level {xpInfo.level} <span className="text-white/20 ml-2">PRO</span></div>
                  </div>
                  <div className="text-right">
                     <span className="text-sm font-bold text-white/60">{xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} <span className="text-[10px] opacity-40">XP</span></span>
                  </div>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-gold to-amber-200 transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-6 bg-white/20" />
                  <h3 className="text-2xl font-heading uppercase italic tracking-wide">Core Attributes</h3>
               </div>
               
               <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: "power", label: "Power Core", icon: Zap, color: "text-brand-gold" },
                    { key: "speed", label: "Sprint Circuit", icon: Wind, color: "text-blue-400" },
                    { key: "strength", label: "Force Matrix", icon: Shield, color: "text-red-400" },
                    { key: "agility", label: "Reflex Drive", icon: Activity, color: "text-green-400" },
                  ].map((upgrade) => (
                    <div key={upgrade.key} className="fifa-panel group flex items-center justify-between gap-4 py-4 px-6 hover:bg-slate-800/80 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="bg-white/5 p-3 rounded group-hover:scale-110 transition-transform">
                             <upgrade.icon size={24} className={upgrade.color} />
                          </div>
                          <div>
                             <h4 className="text-xl font-heading uppercase italic leading-none mb-1">{upgrade.label}</h4>
                             <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Efficiency: {progress.upgrades[upgrade.key as keyof typeof progress.upgrades]} Lv</p>
                          </div>
                       </div>
                       <button
                         onClick={() => upgradeStat(upgrade.key as any)}
                         disabled={availablePoints <= 0}
                         className={`fifa-button !px-6 !py-2 !text-xs ${availablePoints <= 0 ? "opacity-20" : ""}`}
                       >
                         Boost
                       </button>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-6 bg-white/20" />
                  <h3 className="text-2xl font-heading uppercase italic tracking-wide">Arena Environment</h3>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {STADIUM_OPTIONS.map((option, index) => {
                    const unlocked = progress.level >= index + 1;
                    const active = progress.upgrades.stadiumFx === option;
                    return (
                      <button
                        key={option}
                        onClick={() => unlocked && setStadiumFx(option)}
                        disabled={!unlocked}
                        className={`fifa-panel group relative text-left p-4 transition-all overflow-hidden ${
                          active ? "border-brand-gold bg-brand-gold/5" : "border-white/5 hover:border-white/20"
                        } ${!unlocked ? "opacity-40" : ""}`}
                      >
                         <div className="flex justify-between items-start mb-4">
                            {unlocked ? (
                               <div className={`${active ? "text-brand-gold" : "text-white/40"}`}>
                                  {active ? <Check size={18} /> : <div className="w-[18px] h-[18px] border border-current rounded-full" />}
                               </div>
                            ) : (
                               <Lock size={18} className="text-white/20" />
                            )}
                         </div>
                         <h5 className={`font-heading text-lg uppercase italic ${active ? "text-brand-gold" : "text-white"}`}>{option}</h5>
                         <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                            {unlocked ? "Available" : `Unlock Lv ${index + 1}`}
                         </p>
                         
                         <div className={`absolute -bottom-2 -right-2 w-16 h-16 rounded-full blur-2xl opacity-20 ${active ? "bg-brand-gold" : "bg-white"}`} />
                      </button>
                    );
                  })}
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="fifa-panel bg-gradient-to-br from-brand-gold/10 to-transparent border-brand-gold/20">
                <h3 className="text-2xl font-heading uppercase italic mb-4">Coach Tips</h3>
                <ul className="space-y-4 text-xs font-medium text-slate-400">
                   <li className="flex gap-3">
                      <ChevronRight size={14} className="text-brand-gold shrink-0" />
                      Upgrade your <span className="text-white font-bold">Power Core</span> to increase your base team rating and stadium impact.
                   </li>
                   <li className="flex gap-3">
                      <ChevronRight size={14} className="text-brand-gold shrink-0" />
                      Winning matches in higher leagues grants more XP, accelerating your level progress.
                   </li>
                   <li className="flex gap-3">
                      <ChevronRight size={14} className="text-brand-gold shrink-0" />
                      New stadium effects are unlocked every level. Some effects provide better tactical visibility.
                   </li>
                </ul>
             </div>

             <div className="fifa-panel text-center py-8">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4">Global Rank</div>
                <div className="text-6xl font-heading italic text-white leading-none">LEAGUE {progress.league}</div>
                <div className="inline-block mt-4 bg-white/5 px-4 py-1 rounded text-[10px] font-bold text-white/60 uppercase tracking-widest">
                   Top 12% Worldwide
                </div>
             </div>
          </div>
        </div>
      </section>
    </main>
  );
}
