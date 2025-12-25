"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import ArenaCanvas from "@/components/ArenaCanvas";
import { useGame } from "@/lib/game-context";
import { Character, MatchEvent, MatchResult, Visuals, Tactic } from "@/lib/types";
import { computeStats, deriveVisuals, getLevelFromXp } from "@/lib/traits";
import { simulateMatch } from "@/game/simulateMatch";
import { Zap, Target, Loader2, Activity, Shield, X, Goal, Sword, ShieldCheck, Flame, Scale, LucideIcon } from "lucide-react";
import { soundManager } from "@/lib/audio";

export default function MatchPage() {
  const router = useRouter();
  const { selectedCharacter, progress, setProgress, setLastMatch } = useGame();
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchCharacter, setMatchCharacter] = useState<Character | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [goalPulse, setGoalPulse] = useState(0);
  const [arenaVisuals, setArenaVisuals] = useState<Visuals | null>(null);
  const [tactic, setTactic] = useState<Tactic>("balanced");
  const [isReady, setIsReady] = useState(false);
  const eventIndexRef = useRef(0);
  const eventsRef = useRef<MatchEvent[]>([]);
  const progressRef = useRef(progress);
  const matchProgressRef = useRef(progress);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!selectedCharacter) {
      router.replace("/select");
      return;
    }
    if (!isReady) return;

    matchProgressRef.current = progressRef.current;
    const { stats, rarity } = computeStats(
      selectedCharacter.attributes,
      selectedCharacter.source,
      progressRef.current.upgrades
    );
    const visuals = deriveVisuals(
      selectedCharacter.attributes,
      selectedCharacter.source,
      rarity,
      progressRef.current.upgrades
    );
    const boostedCharacter = { ...selectedCharacter, stats, visuals, rarity };
    setArenaVisuals(visuals);
    setMatchCharacter(boostedCharacter);
    const result = simulateMatch(boostedCharacter, progressRef.current, tactic);
    setMatchResult(result);
    eventsRef.current = result.events;
    eventIndexRef.current = 0;
    setScore({ player: 0, ai: 0 });
    setElapsed(0);
  }, [selectedCharacter, router, isReady, tactic]);

  useEffect(() => {
    if (!matchResult) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const seconds = (Date.now() - start) / 1000;
      setElapsed(seconds);

      const currentEvent = eventsRef.current[eventIndexRef.current];
      if (currentEvent && seconds >= currentEvent.time) {
        eventIndexRef.current += 1;
        if (currentEvent.kind === "goal") {
          setGoalPulse((pulse) => pulse + 1);
          soundManager?.play("goal", "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3", 0.4);
        }
        if (currentEvent.kind === "goal") {
          setMessage("GOAL!");
        } else if (currentEvent.kind === "save") {
          setMessage("SAVED!");
          soundManager?.play("save", "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", 0.3);
        } else {
          setMessage("MISS!");
          soundManager?.play("miss", "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3", 0.2);
        }
        if (currentEvent.kind === "goal") {
          setScore((prev) => ({
            player: prev.player + (currentEvent.team === "player" ? 1 : 0),
            ai: prev.ai + (currentEvent.team === "ai" ? 1 : 0),
          }));
        }
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
        }
        messageTimeoutRef.current = setTimeout(() => setMessage(null), 1200);
      }

      if (seconds >= matchResult.duration) {
        clearInterval(timer);
        if (!matchCharacter) return;
        
        const baseProgress = matchProgressRef.current;
        const newXp = baseProgress.xp + matchResult.xpEarned;
        const newWins = baseProgress.wins + (matchResult.winner === "player" ? 1 : 0);
        const newLosses = baseProgress.losses + (matchResult.winner === "ai" ? 1 : 0);
        const newLeague = Math.max(1, Math.floor(newWins / 3) + 1);
        const level = getLevelFromXp(newXp);
        
        const historyEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          playerScore: matchResult.playerScore,
          aiScore: matchResult.aiScore,
          winner: matchResult.winner,
          xpEarned: matchResult.xpEarned,
          tactic: matchResult.tactic,
          characterName: matchCharacter.name,
        };

        setProgress({
          ...baseProgress,
          xp: newXp,
          wins: newWins,
          losses: newLosses,
          league: newLeague,
          level,
          history: [historyEntry, ...(baseProgress.history || [])].slice(0, 10),
        });
        setLastMatch(matchResult);
        if (resultTimeoutRef.current) {
          clearTimeout(resultTimeoutRef.current);
        }
        resultTimeoutRef.current = setTimeout(() => router.replace("/result"), 1000);
      }
    }, 120);

    return () => {
      clearInterval(timer);
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, [matchResult, progress, router, setLastMatch, setProgress, matchCharacter]);

  if (!selectedCharacter) return null;

  if (!isReady) {
    const tactics: { id: Tactic; name: string; icon: LucideIcon; desc: string; stats: string }[] = [
      {
        id: "balanced",
        name: "Standard",
        icon: Scale,
        desc: "Balanced attack and defense.",
        stats: "All Stats 100%",
      },
      {
        id: "offensive",
        name: "Total Attack",
        icon: Sword,
        desc: "High pressure, vulnerable to counters.",
        stats: "ATK +15% / DEF -15%",
      },
      {
        id: "defensive",
        name: "Park the Bus",
        icon: ShieldCheck,
        desc: "Solid defense, low scoring chance.",
        stats: "DEF +15% / ATK -15%",
      },
      {
        id: "aggressive",
        name: "Full Blitz",
        icon: Flame,
        desc: "Chaotic play style. High risk/reward.",
        stats: "ATK +25% / DEF -30%",
      },
    ];

    return (
      <main className="min-h-screen bg-brand-navy">
        <TopNav />
        <section className="max-w-4xl mx-auto px-4 py-12 animate-entrance">
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-7xl font-heading uppercase italic tracking-tighter mb-4">
              Match <span className="text-brand-gold">Tactics</span>
            </h1>
            <p className="text-slate-400 uppercase tracking-widest text-sm font-bold">Select your approach for the upcoming clash</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {tactics.map((t) => (
              <button
                key={t.id}
                onClick={() => setTactic(t.id)}
                className={`fifa-panel text-left transition-all group ${
                  tactic === t.id ? "border-brand-gold bg-brand-gold/5" : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${tactic === t.id ? "bg-brand-gold text-black" : "bg-white/5 text-white/60"}`}>
                    <t.icon size={24} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-heading italic uppercase ${tactic === t.id ? "text-brand-gold" : "text-white"}`}>
                      {t.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">{t.desc}</p>
                    <span className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 bg-white/5 rounded text-brand-gold/80 border border-brand-gold/20">
                      {t.stats}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                setIsReady(true);
                soundManager?.play("click", "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", 0.3);
              }}
              className="fifa-button px-16 text-2xl flex items-center gap-4 group"
            >
              Start Match
              <Target className="group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!matchResult || !matchCharacter) {
    return (
      <main className="min-h-screen">
        <TopNav />
        <section className="flex items-center justify-center pt-32 px-4">
          <div className="fifa-panel text-center max-w-sm w-full">
            <Loader2 size={48} className="animate-spin text-brand-gold mx-auto mb-4" />
            <h2 className="text-3xl font-heading uppercase italic">Setting up Arena</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Initializing pitch dynamics...</p>
          </div>
        </section>
      </main>
    );
  }

  const percent = Math.min((elapsed / matchResult.duration) * 100, 100);
  const opponentImages = [
    "/characters/atlas-keeper.svg",
    "/characters/forge-captain.svg",
    "/characters/nova-sweeper.svg",
    "/characters/pulse-winger.svg",
    "/characters/rift-playmaker.svg",
  ];
  const hashId = matchCharacter.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const opponentImage = opponentImages[hashId % opponentImages.length];
  const normalizeKey = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const getTraitNumber = (labels: string[], fallback: number) => {
    const normalizedLabels = labels.map(normalizeKey);
    const trait = matchCharacter.attributes.find((item) => {
      const key = normalizeKey(item.trait_type);
      return normalizedLabels.some((label) => key === label || key.includes(label));
    });
    if (!trait) return fallback;
    const parsed = Number.parseFloat(String(trait.value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(parsed) ? fallback : parsed;
  };
  const overall = Math.round(
    getTraitNumber(["Overall", "OVR", "Rating", "Power"], matchCharacter.stats.power)
  );

  const feedCopy = {
    player: {
      goal: [
        "Precision strike finds the net.",
        "A dazzling combo ends in a finish.",
        "Blitz timing breaks the defense.",
      ],
      save: [
        "Shot on target, but it's denied.",
        "Keeper shuts down the lane.",
        "A strong save keeps it level.",
      ],
      miss: [
        "Too much power — it sails wide.",
        "Shot clips the post and out.",
        "Rushed attempt misses the frame.",
      ],
    },
    ai: {
      goal: [
        "Opponent breaks through the defense.",
        "AI counter opens the goal.",
        "A sudden strike beats the line.",
      ],
      save: [
        "Your keeper keeps it out.",
        "A clutch save denies the AI.",
        "Defense blocks the shot on target.",
      ],
      miss: [
        "AI spray shot goes wide.",
        "Opponent mistimes the finish.",
        "Shot flies over the bar.",
      ],
    },
  };
  const feedStyle = {
    goal: {
      label: "Goal",
      icon: Goal,
      color: "text-brand-gold",
      chip: "bg-brand-gold/10 border-brand-gold/40",
    },
    save: {
      label: "Saved",
      icon: Shield,
      color: "text-blue-300",
      chip: "bg-blue-500/10 border-blue-500/40",
    },
    miss: {
      label: "Miss",
      icon: X,
      color: "text-slate-400",
      chip: "bg-white/5 border-white/10",
    },
  };

  return (
    <main className="min-h-screen pb-24 md:pb-0">
      <TopNav />
      <section className="max-w-7xl mx-auto px-4 py-8 animate-entrance">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-black">
              <ArenaCanvas
                aura={(arenaVisuals ?? matchCharacter.visuals).aura}
                stadium={(arenaVisuals ?? matchCharacter.visuals).stadium}
                goalPulse={goalPulse}
                playerImage={matchCharacter.image}
                opponentImage={opponentImage}
                events={matchResult.events}
                elapsed={elapsed}
              />
              
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-1">
                 <div className="bg-brand-navy border border-white/20 px-6 py-2 flex items-center gap-4 skew-x-[-12deg]">
                    <div className="skew-x-[12deg] flex flex-col items-center">
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Player</span>
                       <span className="text-2xl font-heading text-white italic leading-none">{score.player}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10 skew-x-[12deg]" />
                    <div className="skew-x-[12deg] flex flex-col items-center">
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Timer</span>
                       <span className="text-2xl font-heading text-brand-gold italic leading-none">{Math.max(0, Math.ceil(matchResult.duration - elapsed))}s</span>
                    </div>
                    <div className="w-px h-8 bg-white/10 skew-x-[12deg]" />
                    <div className="skew-x-[12deg] flex flex-col items-center">
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">CPU</span>
                       <span className="text-2xl font-heading text-white italic leading-none">{score.ai}</span>
                    </div>
                 </div>
              </div>

              {message && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[2px] animate-in fade-in zoom-in duration-300">
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-brand-gold uppercase tracking-[0.5em] mb-2 animate-bounce">Goal Alert</div>
                    <h2 className="text-8xl font-heading uppercase italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                      {message}
                    </h2>
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                 <div 
                   className="h-full bg-brand-gold shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all duration-300"
                   style={{ width: `${percent}%` }}
                 />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
               <div className="fifa-panel py-4 px-6 flex items-center gap-4">
                  <div className="bg-white/5 p-2 rounded"><Zap size={20} className="text-brand-gold" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Team Rating</div>
                    <div className="text-2xl font-heading italic">{overall} OVR</div>
                  </div>
               </div>
               <div className="fifa-panel py-4 px-6 flex items-center gap-4">
                  <div className="bg-white/5 p-2 rounded"><Activity size={20} className="text-blue-400" /></div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Arena Load</div>
                    <div className="text-2xl font-heading italic">STABLE</div>
                  </div>
               </div>
               <div className="fifa-panel py-4 px-6 flex items-center gap-4 text-brand-gold">
                  <div className="bg-brand-gold/10 p-2 rounded"><Target size={20} /></div>
                  <div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-white">Match Status</div>
                    <div className="text-2xl font-heading italic">IN PROGRESS</div>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6 h-full">
            <div className="fifa-panel h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-1 w-8 bg-brand-gold" />
                <h3 className="text-2xl font-heading uppercase italic">Match Feed</h3>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {matchResult.events.map((event, index) => {
                   const isPast = elapsed >= event.time;
                   const teamKey = event.team === "player" ? "player" : "ai";
                   const kindKey = event.kind;
                   const kindStyle = feedStyle[kindKey];
                   const copyList = feedCopy[teamKey][kindKey];
                   const copy = copyList[index % copyList.length];
                   const KindIcon = kindStyle.icon;
                   return (
                    <div 
                      key={`${event.time}-${index}`} 
                      className={`flex items-start gap-4 transition-all duration-500 ${isPast ? "opacity-100" : "opacity-10"}`}
                    >
                      <div className="font-heading text-brand-gold italic min-w-[30px]">{event.time}s</div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold uppercase tracking-widest mb-1 text-white/60">
                          {event.team === "player" ? "Squad Action" : "Opponent Action"}
                        </div>
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${kindStyle.chip} ${kindStyle.color}`}
                          >
                            <KindIcon size={12} />
                            {kindStyle.label}
                          </span>
                        </div>
                        <div className="text-sm font-medium">{copy}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Potential XP</span>
                    <span className="text-2xl font-heading text-brand-gold">+{matchResult.xpEarned}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fbbf24;
          border-radius: 2px;
        }
      `}</style>
    </main>
  );
}
