"use client";

import { GameProvider } from "@/lib/game-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
