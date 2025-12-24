export type Trait = {
  trait_type: string;
  value: string;
};

export type Stats = {
  power: number;
  speed: number;
  strength: number;
  agility: number;
  control: number;
  stamina: number;
};

export type Visuals = {
  aura: string;
  frame: string;
  particle: string;
  stadium: string;
  glow: number;
  tier: "standard" | "prestige";
};

export type CharacterSource = "public" | "wallet";

export type Character = {
  id: string;
  name: string;
  image: string;
  attributes: Trait[];
  source: CharacterSource;
  tokenId?: string;
  rarity: string;
  stats: Stats;
  visuals: Visuals;
};

export type UpgradeState = {
  power: number;
  speed: number;
  strength: number;
  agility: number;
  stadiumFx: string;
};

export type Progress = {
  xp: number;
  level: number;
  league: number;
  wins: number;
  losses: number;
  upgrades: UpgradeState;
};

export type WalletState = {
  address: string | null;
  chainId: number | null;
  status: "disconnected" | "connecting" | "connected";
  providerType: "injected" | "walletconnect" | null;
};

export type MatchEvent = {
  time: number;
  team: "player" | "ai";
};

export type MatchResult = {
  playerScore: number;
  aiScore: number;
  winner: "player" | "ai" | "draw";
  xpEarned: number;
  duration: number;
  events: MatchEvent[];
};
