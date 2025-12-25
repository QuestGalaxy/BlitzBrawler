"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "./WalletButton";
import { Trophy, Users, Sword, TrendingUp, Volume2, VolumeX } from "lucide-react";
import { soundManager } from "@/lib/audio";
import { useState, useEffect } from "react";

export default function TopNav() {
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (soundManager) {
      setMuted(soundManager.isMuted());
    }
  }, []);

  const toggleMute = () => {
    if (soundManager) {
      setMuted(soundManager.toggleMute());
    }
  };

  const navItems = [
    { label: "Home", href: "/", icon: Trophy },
    { label: "Team", href: "/select", icon: Users },
    { label: "Arena", href: "/match", icon: Sword },
    { label: "Boost", href: "/upgrade", icon: TrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-brand-navy/95 border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-brand-gold p-1 skew-x-[-12deg]">
              <div className="skew-x-[12deg] flex items-center gap-1 px-2">
                <span className="font-heading text-2xl text-black italic">BLITZ</span>
                <span className="font-heading text-2xl text-black opacity-60">BRAWLER</span>
              </div>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-2 px-4 py-2 font-heading text-lg uppercase transition-all
                    ${isActive ? "text-brand-gold" : "text-white/60 hover:text-white"}`}
                >
                  <Icon size={18} className={isActive ? "animate-pulse" : ""} />
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-[-1.5rem] left-0 right-0 h-1 bg-brand-gold skew-x-[-12deg]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Wallet Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMute}
              className="p-2 text-white/40 hover:text-white transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] text-right mb-1">
                Polygon Mainnet
              </div>
              <WalletButton variant="ghost" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation - Bottom Bar Style (Optional but recommended for mobile-first) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-white/10 px-4 py-2 flex justify-around items-center z-50">
         {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 transition-all
                    ${isActive ? "text-brand-gold scale-110" : "text-white/40"}`}
                >
                  <Icon size={20} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                </Link>
              );
            })}
      </div>
    </nav>
  );
}