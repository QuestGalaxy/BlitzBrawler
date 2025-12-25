import { Character, MatchEvent, MatchResult, Progress, Tactic } from "@/lib/types";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function simulateMatch(player: Character, progress: Progress, tactic: Tactic = "balanced"): MatchResult {
  const duration = 12 + Math.floor(Math.random() * 6);
  const leagueBoost = 1 + progress.league * 0.05;

  const normalizeKey = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const getTraitValue = (labels: string[], fallback: number) => {
    const normalizedLabels = labels.map(normalizeKey);
    const trait = player.attributes.find((item) => {
      const key = normalizeKey(item.trait_type);
      return normalizedLabels.some((label) => key === label || key.includes(label));
    });
    if (!trait) return fallback;
    const parsed = Number.parseFloat(String(trait.value).replace(/[^0-9.]/g, ""));
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const traitStats = {
    power: getTraitValue(["Power", "Overall", "OVR", "Rating"], player.stats.power),
    speed: getTraitValue(["Speed"], player.stats.speed),
    strength: getTraitValue(["Strength"], player.stats.strength),
    agility: getTraitValue(["Agility"], player.stats.agility),
    control: getTraitValue(["Control", "Skill"], player.stats.control),
    stamina: getTraitValue(["Stamina", "Endurance"], player.stats.stamina),
  };

  // Apply Tactic Modifiers
  let attackMod = 1.0;
  let defenseMod = 1.0;
  let eventFrequencyMod = 1.0;

  switch (tactic) {
    case "offensive":
      attackMod = 1.15;
      defenseMod = 0.85;
      eventFrequencyMod = 1.1;
      break;
    case "defensive":
      attackMod = 0.85;
      defenseMod = 1.15;
      eventFrequencyMod = 0.9;
      break;
    case "aggressive":
      attackMod = 1.25;
      defenseMod = 0.7;
      eventFrequencyMod = 1.3;
      break;
    case "balanced":
    default:
      attackMod = 1.0;
      defenseMod = 1.0;
      eventFrequencyMod = 1.0;
      break;
  }

  const playerAttack =
    (traitStats.power * 0.35 +
      traitStats.speed * 0.3 +
      traitStats.agility * 0.25 +
      traitStats.control * 0.1) *
    attackMod;
  const playerDefense =
    (traitStats.strength * 0.5 +
      traitStats.stamina * 0.3 +
      traitStats.control * 0.2) *
    defenseMod;
  const playerRating = (playerAttack + playerDefense) / 2 + progress.level * 1.5;

  const aiMultiplier = clamp(0.9 + progress.league * 0.04 + randomBetween(-0.05, 0.08), 0.85, 1.2);
  const aiAttack = playerAttack * aiMultiplier * leagueBoost;
  const aiDefense = playerDefense * aiMultiplier * leagueBoost;
  const aiRating = (aiAttack + aiDefense) / 2;

  const possessionChance = clamp(
    0.5 + ((playerRating - aiRating) / (playerRating + aiRating)) * 0.25,
    0.35,
    0.65
  );

  const playCount = clamp(Math.round((duration / 2 + randomBetween(-1, 2)) * eventFrequencyMod), 4, 12);
  const times = new Set<number>();
  while (times.size < playCount) {
    times.add(Math.floor(randomBetween(2, duration - 2)));
  }
  const sortedTimes = Array.from(times).sort((a, b) => a - b);

  let playerScore = 0;
  let aiScore = 0;
  const events: MatchEvent[] = [];

  sortedTimes.forEach((time) => {
    const attackingTeam = Math.random() < possessionChance ? "player" : "ai";
    const attackValue = attackingTeam === "player" ? playerAttack : aiAttack;
    const defenseValue = attackingTeam === "player" ? aiDefense : playerDefense;
    const onTargetChance = clamp(0.45 + (attackValue - defenseValue) / 220, 0.25, 0.7);
    const scoringChance = clamp(attackValue / (attackValue + defenseValue), 0.15, 0.6);
    const onTarget = Math.random() < onTargetChance;

    let kind: MatchEvent["kind"] = "miss";
    if (onTarget) {
      const scored = Math.random() < scoringChance;
      kind = scored ? "goal" : "save";
      if (scored) {
        if (attackingTeam === "player") {
          playerScore += 1;
        } else {
          aiScore += 1;
        }
      }
    }

    events.push({ time, team: attackingTeam, kind });
  });

  const winner = playerScore > aiScore ? "player" : aiScore > playerScore ? "ai" : "draw";
  const baseXp = winner === "player" ? 160 : winner === "draw" ? 90 : 60;
  const xpEarned = Math.round(baseXp + progress.league * 20 + traitStats.power * 0.2);

  return {
    playerScore,
    aiScore,
    winner,
    xpEarned,
    duration,
    events,
    tactic,
  };
}
