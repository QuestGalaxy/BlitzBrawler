"use client";

import { Character } from "@/lib/types";
import { formatStat } from "@/lib/traits";
import { Shield, Zap, Target, Wind, Activity, Brain } from "lucide-react";

export default function StatsPanel({ character }: { character: Character | null }) {
  if (!character) {
    return (
      <div className="fifa-panel border-dashed border-slate-700">
        <div className="text-center py-10">
          <div className="text-6xl font-heading text-white/5 uppercase italic select-none">Preview</div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4">
            Select a player to view metrics
          </p>
        </div>
      </div>
    );
  }

  const { stats } = character;

  const statConfig = [
    { label: "Power", value: stats.power, icon: Zap, color: "bg-brand-gold" },
    { label: "Speed", value: stats.speed, icon: Wind, color: "bg-blue-400" },
    { label: "Strength", value: stats.strength, icon: Shield, color: "bg-red-400" },
    { label: "Agility", value: stats.agility, icon: Activity, color: "bg-green-400" },
    { label: "Control", value: stats.control, icon: Target, color: "bg-purple-400" },
    { label: "Stamina", value: stats.stamina, icon: Brain, color: "bg-amber-400" },
  ];

  return (
    <div className="fifa-panel relative overflow-hidden group">
      {/* Background Glow */}
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: character.visuals.aura }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-4xl font-heading uppercase italic tracking-tighter leading-none mb-1">
              {character.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">
                {character.rarity} Card
              </span>
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                Stadium: {character.visuals.stadium}
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-4xl font-heading text-brand-gold italic">{formatStat(stats.power)}</div>
             <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Rating</div>
          </div>
        </div>

        <div className="space-y-4">
          {statConfig.map((stat) => {
            const Icon = stat.icon;
            const percentage = Math.min(100, (stat.value / 100) * 100);
            
            return (
              <div key={stat.label} className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="opacity-60" />
                    <span>{stat.label}</span>
                  </div>
                  <span className={stat.value > 80 ? "text-brand-gold" : "text-white"}>
                    {formatStat(stat.value)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${stat.color} shadow-[0_0_10px_rgba(251,191,36,0.2)]`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Traits Chips */}
        <div className="mt-8">
           <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Player Traits</div>
           <div className="flex flex-wrap gap-2">
              {character.attributes.map((trait) => (
                <div 
                  key={`${trait.trait_type}-${trait.value}`}
                  className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter"
                >
                  <span className="opacity-40">{trait.trait_type}: </span>
                  <span className="text-brand-gold">{String(trait.value)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}