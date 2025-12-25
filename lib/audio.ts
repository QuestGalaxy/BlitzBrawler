"use client";

class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private muted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = localStorage.getItem("blitzbrawler:muted") === "true";
    }
  }

  play(name: string, url: string, volume: number = 0.5) {
    if (this.muted || typeof window === "undefined") return;

    if (!this.sounds[name]) {
      this.sounds[name] = new Audio(url);
    }
    
    const sound = this.sounds[name];
    sound.volume = volume;
    sound.currentTime = 0;
    sound.play().catch(() => {
      // Ignore autoplay errors
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("blitzbrawler:muted", String(this.muted));
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const soundManager = typeof window !== "undefined" ? new SoundManager() : null;
