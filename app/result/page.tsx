"use client";

import Link from "next/link";
import TopNav from "@/components/TopNav";
import { useGame } from "@/lib/game-context";
import { Trophy, ArrowLeft, RotateCcw, TrendingUp, ChevronRight } from "lucide-react";

export default function ResultPage() {
  const { lastMatch, selectedCharacter } = useGame();

  if (!lastMatch) {
    return (
      <main className="min-h-screen">
        <TopNav />
        <section className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
          <div className="fifa-panel text-center max-w-sm">
             <Trophy size={48} className="mx-auto text-slate-700 mb-4" />
             <h2 className="text-3xl font-heading uppercase italic">No Match Data</h2>
             <p className="text-slate-500 mb-6">Complete a match to see your rewards here.</p>
             <Link href="/select" className="fifa-button w-full inline-block">Choose Squad</Link>
          </div>
        </section>
      </main>
    );
  }

  const isVictory = lastMatch.winner === "player";
  const verdict = isVictory ? "Victory" : lastMatch.winner === "ai" ? "Defeat" : "Draw";

  return (
    <main className="min-h-screen pb-24 md:pb-0">
      <TopNav />
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-16 animate-entrance">
        <div className="max-w-3xl mx-auto">
          
          {/* Main Result Card */}
          <div className={`fifa-panel relative overflow-hidden text-center py-12 px-8 ${isVictory ? "border-brand-gold" : "border-red-500/50"}`}>
            {/* Background Glow */}
            <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 blur-[120px] opacity-20 ${isVictory ? "bg-brand-gold" : "bg-red-500"}`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-1 w-8 bg-brand-gold" />
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-white/60">Match Conclusion</span>
                <div className="h-1 w-8 bg-brand-gold" />
              </div>

              <h1 className={`text-8xl md:text-9xl font-heading uppercase italic tracking-tighter mb-4 ${isVictory ? "text-brand-gold" : "text-white"}`}>
                {verdict}
              </h1>

              <div className="flex justify-center items-center gap-8 mb-10">
                <div className="text-center">
                   <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Your Squad</div>
                   <div className="text-6xl font-heading italic">{lastMatch.playerScore}</div>
                </div>
                <div className="text-4xl font-heading text-white/20 italic mt-6">VS</div>
                <div className="text-center">
                   <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Opponent</div>
                   <div className="text-6xl font-heading italic">{lastMatch.aiScore}</div>
                </div>
              </div>

              {/* Player Reveal Preview */}
              {selectedCharacter && (
                <div className="relative h-48 mb-10 group">
                   <img 
                    src={selectedCharacter.image} 
                    className="h-full mx-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500" 
                    alt="MVP"
                   />
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-brand-gold text-black font-heading italic px-4 py-1 skew-x-[-12deg] text-xl">
                      MVP: {selectedCharacter.name}
                   </div>
                </div>
              )}

              {/* Rewards Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
                 <div className="bg-white/5 border border-white/10 p-4 rounded skew-x-[-6deg]">
                    <div className="skew-x-[6deg]">
                       <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">XP Gain</div>
                       <div className="text-3xl font-heading text-brand-gold italic">+{lastMatch.xpEarned}</div>
                    </div>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded skew-x-[-6deg]">
                    <div className="skew-x-[6deg]">
                       <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">League Pos</div>
                       <div className="text-3xl font-heading text-white italic">#1,240</div>
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Link href="/match" className="fifa-button flex items-center justify-center gap-2 group min-w-[180px]">
                    <RotateCcw size={18} />
                    Rematch
                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                 </Link>
                 <Link href="/upgrade" className="flex items-center justify-center gap-2 px-8 py-3 font-heading text-xl uppercase italic text-white/60 hover:text-white transition-all">
                    <TrendingUp size={18} />
                    Upgrade Skills
                 </Link>
                 <Link href="/select" className="flex items-center justify-center gap-2 px-8 py-3 font-heading text-xl uppercase italic text-white/60 hover:text-white transition-all">
                    <ArrowLeft size={18} />
                    Roster
                 </Link>
              </div>
            </div>
          </div>
          
          {/* Post-Match Summary */}
          <div className="mt-8 flex items-center justify-center gap-12 text-center opacity-40">
             <div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Total Wins</div>
                <div className="text-xl font-heading italic">42</div>
             </div>
             <div className="h-8 w-px bg-white/20" />
             <div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Global Rank</div>
                <div className="text-xl font-heading italic">Silver II</div>
             </div>
             <div className="h-8 w-px bg-white/20" />
             <div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Win Streak</div>
                <div className="text-xl font-heading italic">3</div>
             </div>
          </div>

        </div>
      </section>
    </main>
  );
}