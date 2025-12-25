import { Progress } from "./types";
import { getLevelFromXp } from "./traits";

const STORAGE_PREFIX = "blitzbrawler";

export function getProgressKey(address?: string | null) {
  const suffix = address ? address.toLowerCase() : "guest";
  return `${STORAGE_PREFIX}:progress:${suffix}`;
}

export function getSelectedKey(address?: string | null) {
  const suffix = address ? address.toLowerCase() : "guest";
  return `${STORAGE_PREFIX}:selected:${suffix}`;
}

export function defaultProgress(): Progress {
  return {
    xp: 0,
    level: 1,
    league: 1,
    wins: 0,
    losses: 0,
    upgrades: {
      power: 0,
      speed: 0,
      strength: 0,
      agility: 0,
      stadiumFx: "Neon Wave",
    },
    history: [],
  };
}

export function loadProgress(address?: string | null): Progress {
  if (typeof window === "undefined") {
    return defaultProgress();
  }
  const key = getProgressKey(address);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return defaultProgress();
  }
  try {
    const parsed = JSON.parse(raw) as Progress;
    const level = getLevelFromXp(parsed.xp ?? 0);
    return {
      ...defaultProgress(),
      ...parsed,
      level,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: Progress, address?: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  const key = getProgressKey(address);
  window.localStorage.setItem(key, JSON.stringify(progress));
}

export function loadSelectedCharacter(address?: string | null) {
  if (typeof window === "undefined") {
    return null;
  }
  const key = getSelectedKey(address);
  return window.localStorage.getItem(key);
}

export function saveSelectedCharacter(id: string, address?: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  const key = getSelectedKey(address);
  window.localStorage.setItem(key, id);
}
