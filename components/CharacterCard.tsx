"use client";

import { Character } from "@/lib/types";
import { Zap } from "lucide-react";

export default function CharacterCard({
  character,
  selected,
  onSelect,
}: {
  character: Character;
  selected: boolean;
  onSelect: (character: Character) => void;
}) {
  const isPrestige = character.source === "wallet";
  const overall = Math.round(character.stats.power);
  
  const getRarityStyles = () => {
    const r = character.rarity.toLowerCase();
    if (r.includes("legendary")) return "from-amber-400 via-yellow-500 to-amber-700 border-amber-300";
    if (r.includes("rare")) return "from-blue-400 via-blue-600 to-indigo-800 border-blue-400";
    if (r.includes("epic")) return "from-purple-400 via-purple-600 to-fuchsia-900 border-purple-400";
    return "from-slate-400 via-slate-500 to-slate-700 border-slate-400";
  };

  return (
    <div
      onClick={() => onSelect(character)}
      className={`group relative cursor-pointer transition-all duration-300 ${
        selected ? "scale-105" : "hover:scale-[1.02]"
      }`}
    >
      <div 
        className={`w-full aspect-[2/3] relative rounded-lg overflow-hidden border-2 shadow-2xl transition-all ${
          selected ? "ring-4 ring-white ring-offset-4 ring-offset-background" : "border-opacity-30"
        } ${getRarityStyles()}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br opacity-90 ${getRarityStyles()}`} />
        <div className="absolute inset-0 bg-noise pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 h-4/5 flex items-end justify-center pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={character.image}
            alt={character.name}
            className="h-full object-contain filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/characters/placeholder.svg";
            }}
          />
        </div>

        <div className="absolute top-4 left-4 flex flex-col items-center text-white">
          <span className="text-4xl font-heading leading-none drop-shadow-md">{overall}</span>
          <span className="text-xs font-heading opacity-80 uppercase tracking-tighter">OVR</span>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-1">
          {isPrestige && (
            <div className="bg-brand-gold text-black p-1 rounded-sm shadow-lg">
              <Zap size={14} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded transform -skew-x-12 border border-white/20">
            <div className="transform skew-x-12 text-white">
              <h3 className="text-sm font-heading uppercase italic truncate leading-none mb-1">
                {character.name}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest">
                  {character.rarity}
                </span>
                <span className="text-[10px] bg-white text-black px-1 font-bold rounded-sm">
                  {isPrestige ? "NFT" : "GUEST"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {selected && (
          <div className="absolute inset-0 border-[3px] border-white animate-pulse pointer-events-none rounded-lg" />
        )}
      </div>
    </div>
  );
}
