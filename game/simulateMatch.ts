import { Character, MatchEvent, MatchResult, Progress } from "@/lib/types";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function simulateMatch(player: Character, progress: Progress): MatchResult {
  const duration = 12 + Math.floor(Math.random() * 6);
  const leagueBoost = 1 + progress.league * 0.05;

  const playerRating =
    (player.stats.power + player.stats.speed + player.stats.agility) / 3 + progress.level * 1.5;
  const aiRating = playerRating * randomBetween(0.85, 1.05) * leagueBoost;
  const winChance = clamp(playerRating / (playerRating + aiRating), 0.2, 0.8);

  const roll = Math.random();
  const winner = roll < winChance ? "player" : roll > winChance + 0.15 ? "ai" : "draw";

  let playerScore = winner === "player" ? Math.ceil(randomBetween(1, 3)) : Math.floor(randomBetween(0, 2));
  let aiScore = winner === "ai" ? Math.ceil(randomBetween(1, 3)) : Math.floor(randomBetween(0, 2));
  if (winner === "draw") {
    const drawScore = Math.floor(randomBetween(0, 2));
    playerScore = drawScore;
    aiScore = drawScore;
  }

  const totalGoals = playerScore + aiScore;
  const events: MatchEvent[] = [];
  for (let i = 0; i < totalGoals; i += 1) {
    const time = Math.floor(randomBetween(2, duration - 2));
    const team = i < playerScore ? "player" : "ai";
    events.push({ time, team });
  }
  events.sort((a, b) => a.time - b.time);

  const baseXp = winner === "player" ? 160 : winner === "draw" ? 90 : 60;
  const xpEarned = Math.round(baseXp + progress.league * 20 + player.stats.power * 0.2);

  return {
    playerScore,
    aiScore,
    winner,
    xpEarned,
    duration,
    events,
  };
}
