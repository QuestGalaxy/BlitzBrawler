import { Stats, Trait, CharacterSource, Visuals, UpgradeState } from "./types";

const BASE_STATS: Stats = {
  power: 55,
  speed: 60,
  strength: 60,
  agility: 60,
  control: 55,
  stamina: 55,
};

const RARITY_MULTIPLIER: Record<string, number> = {
  common: 1,
  uncommon: 1.05,
  rare: 1.12,
  epic: 1.2,
  legendary: 1.3,
  mythic: 1.4,
};

const AURA_COLORS = [
  "#24f0ff",
  "#7affb8",
  "#ff9a3d",
  "#7aa6ff",
  "#ff7bd8",
  "#b56bff",
];

const STADIUM_EFFECTS = [
  "Neon Wave",
  "Crimson Burst",
  "Aurora Pulse",
  "Solar Flare",
  "Quantum Mist",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeValue(value: string) {
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(numeric)) {
    return clamp(numeric, 0, 100);
  }
  const hashed = hashString(String(value));
  return 40 + (hashed % 61);
}

function getRarity(attributes: Trait[]) {
  const rarityTrait = attributes.find((trait) =>
    trait.trait_type.toLowerCase().includes("rarity")
  );
  if (!rarityTrait) {
    return "common";
  }
  return String(rarityTrait.value).toLowerCase();
}

function deriveAura(attributes: Trait[]) {
  const key = attributes.map((trait) => `${trait.trait_type}:${trait.value}`).join("|");
  const index = hashString(key) % AURA_COLORS.length;
  return AURA_COLORS[index];
}

function deriveStadium(attributes: Trait[]) {
  const backgroundTrait = attributes.find((trait) =>
    trait.trait_type.toLowerCase().includes("background")
  );
  if (backgroundTrait) {
    return String(backgroundTrait.value);
  }
  const index = hashString(attributes.map((trait) => trait.value).join("|")) % STADIUM_EFFECTS.length;
  return STADIUM_EFFECTS[index];
}

export function computeStats(
  attributes: Trait[],
  source: CharacterSource,
  upgrades?: UpgradeState
) {
  const stats: Stats = { ...BASE_STATS };
  const traitMap = attributes.reduce<Record<string, string>>((acc, trait) => {
    acc[trait.trait_type.toLowerCase()] = String(trait.value);
    return acc;
  }, {});

  Object.entries(traitMap).forEach(([key, value]) => {
    const normalized = normalizeValue(value);
    if (key.includes("speed")) stats.speed = clamp(stats.speed + normalized * 0.4, 40, 100);
    if (key.includes("strength")) stats.strength = clamp(stats.strength + normalized * 0.4, 40, 100);
    if (key.includes("agility")) stats.agility = clamp(stats.agility + normalized * 0.4, 40, 100);
    if (key.includes("control") || key.includes("skill")) stats.control = clamp(stats.control + normalized * 0.35, 40, 100);
    if (key.includes("stamina") || key.includes("endurance")) stats.stamina = clamp(stats.stamina + normalized * 0.35, 40, 100);
  });

  attributes.forEach((trait) => {
    const key = trait.trait_type.toLowerCase();
    if (
      key.includes("speed") ||
      key.includes("strength") ||
      key.includes("agility") ||
      key.includes("control") ||
      key.includes("skill") ||
      key.includes("stamina") ||
      key.includes("endurance") ||
      key.includes("rarity") ||
      key.includes("background") ||
      key.includes("origin") ||
      key.includes("genesis")
    ) {
      return;
    }
    const boost = (hashString(`${trait.trait_type}:${trait.value}`) % 12) * 0.6;
    stats.control = clamp(stats.control + boost, 40, 110);
    stats.stamina = clamp(stats.stamina + boost * 0.6, 40, 110);
  });

  const rarityKey = getRarity(attributes);
  const rarityMultiplier = RARITY_MULTIPLIER[rarityKey] ?? 1 + (hashString(rarityKey) % 10) / 100;

  const originTrait = attributes.find((trait) =>
    trait.trait_type.toLowerCase().includes("origin") ||
    trait.trait_type.toLowerCase().includes("genesis")
  );
  const originBonus = originTrait && /genesis|early/i.test(String(originTrait.value)) ? 1.05 : 1;

  const sourceBonus = source === "wallet" ? 1.08 : 1;

  const appliedUpgrades = upgrades ?? {
    power: 0,
    speed: 0,
    strength: 0,
    agility: 0,
    stadiumFx: "Neon Wave",
  };

  stats.speed = clamp(stats.speed + appliedUpgrades.speed * 4, 40, 110);
  stats.strength = clamp(stats.strength + appliedUpgrades.strength * 4, 40, 110);
  stats.agility = clamp(stats.agility + appliedUpgrades.agility * 4, 40, 110);
  stats.control = clamp(stats.control + appliedUpgrades.power * 3, 40, 110);
  stats.stamina = clamp(stats.stamina + appliedUpgrades.power * 2, 40, 110);

  const combined =
    (stats.speed + stats.strength + stats.agility + stats.control + stats.stamina) / 5;
  stats.power = clamp(combined * rarityMultiplier * originBonus * sourceBonus, 45, 130);

  return { stats, rarity: rarityKey };
}

export function deriveVisuals(
  attributes: Trait[],
  source: CharacterSource,
  rarity: string,
  upgrades?: UpgradeState
): Visuals {
  const aura = deriveAura(attributes);
  const stadium = upgrades?.stadiumFx ?? deriveStadium(attributes);
  const glow = clamp(0.5 + (RARITY_MULTIPLIER[rarity] ?? 1) * 0.6, 0.5, 1.6);
  return {
    aura,
    stadium,
    frame: source === "wallet" ? "prestige" : "standard",
    particle: rarity,
    glow,
    tier: source === "wallet" ? "prestige" : "standard",
  };
}

export function formatStat(value: number) {
  return Math.round(value);
}

export function getUpgradePoints(progressXp: number) {
  const level = getLevelFromXp(progressXp);
  return Math.max(level - 1, 0);
}

export function getLevelFromXp(xp: number) {
  let level = 1;
  let threshold = 0;
  while (xp >= threshold + level * 250) {
    threshold += level * 250;
    level += 1;
  }
  return level;
}

export function getXpForNextLevel(xp: number) {
  const level = getLevelFromXp(xp);
  let threshold = 0;
  for (let i = 1; i < level; i += 1) {
    threshold += i * 250;
  }
  const nextThreshold = threshold + level * 250;
  return {
    level,
    currentLevelXp: xp - threshold,
    nextLevelXp: nextThreshold - threshold,
  };
}
