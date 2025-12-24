"use client";

import Link from "next/link";
import TopNav from "@/components/TopNav";
import { Trophy, Users, TrendingUp, Zap, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <TopNav />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-entrance">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-12 bg-brand-gold" />
              <span className="text-sm font-bold text-brand-gold uppercase tracking-[0.4em]">
                New Event: Neon Arena
              </span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-heading uppercase italic tracking-tighter leading-[0.85] mb-8 text-white">
              Blitz <br />
              <span className="text-brand-gold">Brawler</span> <br />
              Arena
            </h1>

            <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed">
              Experience the next generation of football auto-battlers. 
              Recruit legendary NFT brawlers, master the stadium, and dominate the leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/select" className="fifa-button flex items-center justify-center gap-3 text-xl px-12">
                Enter Stadium
                <ChevronRight size={24} />
              </Link>
              <Link href="/upgrade" className="flex items-center justify-center gap-2 px-8 py-3 font-heading text-xl uppercase italic text-white/60 hover:text-white transition-all">
                <TrendingUp size={20} />
                Upgrade Roster
              </Link>
            </div>
          </div>

          {/* Decorative Elements / Character Preview */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy to-transparent z-10" />
            <div className="relative aspect-square">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-gold/10 rounded-full blur-[120px]" />
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
                 src="/characters/vega-striker.svg" 
                 alt="Hero Player"
                 className="relative z-20 w-full h-full object-contain animate-float"
                 style={{ filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.5))" }}
               />
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <FeatureCard 
            icon={Zap} 
            title="Real-Time Traits" 
            desc="NFT attributes map directly to player performance in the arena." 
          />
          <FeatureCard 
            icon={Trophy} 
            title="Pro Leagues" 
            desc="Climb the divisions to unlock exclusive stadium rewards." 
          />
          <FeatureCard 
            icon={Users} 
            title="Connect & Play" 
            desc="Use your own wallet or play with the public starter squad." 
          />
        </div>
      </div>

      {/* Background Graphic elements */}
      <div className="fixed top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-brand-gold/20 to-transparent" />
        <div className="h-full w-full border-r-[100px] border-white/5 transform skew-x-[-20deg]" />
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType, title: string, desc: string }) {
  return (
    <div className="fifa-panel group hover:bg-slate-800/90 transition-all cursor-default text-white">
      <div className="bg-brand-gold/10 w-12 h-12 flex items-center justify-center rounded mb-4 group-hover:scale-110 transition-transform">
        <Icon className="text-brand-gold" size={24} />
      </div>
      <h3 className="text-xl font-heading uppercase italic mb-2 tracking-wide">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
