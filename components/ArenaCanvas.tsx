"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { MatchEvent } from "@/lib/types";

function hexToNumber(hex: string) {
  return Number(`0x${hex.replace("#", "")}`);
}

type ArenaCanvasProps = {
  aura: string;
  stadium: string;
  goalPulse: number;
  playerImage: string;
  opponentImage: string;
  events: MatchEvent[];
  elapsed: number;
};

export default function ArenaCanvas({
  aura,
  stadium,
  goalPulse,
  playerImage,
  opponentImage,
  events,
  elapsed,
}: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const eventsRef = useRef<MatchEvent[]>([]);
  const elapsedRef = useRef(0);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;
    let app: PIXI.Application | null = null;
    
    const initApp = async () => {
      try {
        app = new PIXI.Application();
        await app.init({
          resizeTo: containerRef.current as HTMLDivElement,
          backgroundAlpha: 0,
          antialias: true,
        });
        
        if (!mounted || !containerRef.current) return;
        appRef.current = app;
        containerRef.current.appendChild(app.canvas);

        const arena = new PIXI.Container();
        app.stage.addChild(arena);

        const bg = new PIXI.Graphics();
        bg.fill({ color: 0x020617 });
        bg.rect(0, 0, app.screen.width, app.screen.height);
        bg.fill();
        arena.addChild(bg);

        const glow = new PIXI.Graphics();
        glow.ellipse(app.screen.width / 2, app.screen.height * 0.8, app.screen.width * 0.7, 180);
        glow.fill({ color: hexToNumber(aura), alpha: 0.1 });
        arena.addChild(glow);

        const field = new PIXI.Graphics();
        field.setStrokeStyle({ width: 1, color: 0x38bdf8, alpha: 0.2 });
        field.roundRect(40, app.screen.height * 0.35, app.screen.width - 80, app.screen.height * 0.45, 24);
        field.stroke();
        
        field.circle(app.screen.width / 2, app.screen.height * 0.58, 60);
        field.stroke();
        
        field.moveTo(app.screen.width / 2, app.screen.height * 0.35);
        field.lineTo(app.screen.width / 2, app.screen.height * 0.8);
        field.stroke();
        arena.addChild(field);

        const loadTexture = async (image: string) => {
          const resolved = image.startsWith("http")
            ? image
            : `${window.location.origin}${image}`;
          try {
            const asset = await PIXI.Assets.load(resolved);
            if (asset instanceof PIXI.Texture) return asset;
            if (asset && "texture" in asset) return asset.texture as PIXI.Texture;
          } catch {
            // Ignore
          }
          const fallback = await PIXI.Assets.load(
            `${window.location.origin}/characters/placeholder.svg`
          );
          if (fallback instanceof PIXI.Texture) return fallback;
          return (fallback as { texture: PIXI.Texture }).texture;
        };

        const createPlayerSprite = (texture: PIXI.Texture, tint: number) => {
          const container = new PIXI.Container();
          const frame = new PIXI.Graphics();
          frame.roundRect(-34, -34, 68, 68, 14);
          frame.fill({ color: 0x0b1220, alpha: 0.6 });
          frame.setStrokeStyle({ width: 2, color: tint, alpha: 0.9 });
          frame.stroke();

          const mask = new PIXI.Graphics();
          mask.roundRect(-28, -28, 56, 56, 10);
          mask.fill({ color: 0xffffff });

          const sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.width = 56;
          sprite.height = 56;
          sprite.mask = mask;

          container.addChild(frame, mask, sprite);
          return container;
        };

        const playerTexture = await loadTexture(playerImage);
        const opponentTexture = await loadTexture(opponentImage);

        const player = createPlayerSprite(playerTexture, hexToNumber(aura));
        player.x = app.screen.width * 0.32;
        player.y = app.screen.height * 0.62;
        arena.addChild(player);

        const ai = createPlayerSprite(opponentTexture, 0xff7bd8);
        ai.x = app.screen.width * 0.68;
        ai.y = app.screen.height * 0.52;
        arena.addChild(ai);

        const ball = new PIXI.Container();
        const ballShadow = new PIXI.Graphics();
        ballShadow.ellipse(0, 4, 8, 3);
        ballShadow.fill({ color: 0x000000, alpha: 0.3 });
        const ballCore = new PIXI.Graphics();
        ballCore.circle(0, 0, 7);
        ballCore.fill({ color: 0xffffff });
        const pentagon = new PIXI.Graphics();
        const points = [0, -3.5, 3.3, -1, 2, 3, -2, 3, -3.3, -1];
        pentagon.poly(points);
        pentagon.fill({ color: 0x111827 });
        const dot1 = new PIXI.Graphics();
        dot1.circle(-4, -2, 1.2);
        dot1.fill({ color: 0x111827 });
        const dot2 = new PIXI.Graphics();
        dot2.circle(4, -1, 1.2);
        dot2.fill({ color: 0x111827 });
        const dot3 = new PIXI.Graphics();
        dot3.circle(0, 4, 1.2);
        dot3.fill({ color: 0x111827 });
        ball.addChild(ballShadow, ballCore, pentagon, dot1, dot2, dot3);
        ball.x = app.screen.width / 2;
        ball.y = app.screen.height * 0.58;
        arena.addChild(ball);

        const trail = new PIXI.Graphics();
        arena.addChild(trail);

        let t = 0;
        const tickerApp = app;
        app.ticker.add(() => {
          t += 0.01;
          const sway = Math.sin(t * 1.8) * 8;
          const bob = Math.cos(t * 1.4) * 6;
          player.y = tickerApp.screen.height * 0.62 + sway;
          player.x = tickerApp.screen.width * 0.32 + bob;
          ai.y = tickerApp.screen.height * 0.52 - sway;
          ai.x = tickerApp.screen.width * 0.68 - bob;

          const now = elapsedRef.current;
          const eventWindow = 1.6;
          let activeEvent: MatchEvent | null = null;
          let eventPhase = 0;
          for (let i = eventsRef.current.length - 1; i >= 0; i -= 1) {
            const candidate = eventsRef.current[i];
            const dt = now - candidate.time;
            if (dt >= 0 && dt <= eventWindow) {
              activeEvent = candidate;
              eventPhase = dt / eventWindow;
              break;
            }
          }

          let ballX = ball.x;
          let ballY = ball.y;
          if (activeEvent) {
            const attacker = activeEvent.team === "player" ? player : ai;
            const goalX =
              activeEvent.team === "player"
                ? tickerApp.screen.width * 0.85
                : tickerApp.screen.width * 0.15;
            const baseGoalY = tickerApp.screen.height * 0.5;
            const missOffset = activeEvent.kind === "miss" ? (activeEvent.team === "player" ? -28 : 28) : 0;
            const goalY = baseGoalY + missOffset;
            const midX = tickerApp.screen.width * 0.5;
            const midY = tickerApp.screen.height * 0.6;

            if (activeEvent.kind === "save" && eventPhase > 0.7) {
              const mix = (eventPhase - 0.7) / 0.3;
              ballX = goalX + (midX - goalX) * mix;
              ballY = goalY + (midY - goalY) * mix + Math.sin(mix * Math.PI) * 10;
            } else {
              const mix = eventPhase / (activeEvent.kind === "save" ? 0.7 : 1);
              const clampedMix = Math.min(mix, 1);
              ballX = attacker.x + (goalX - attacker.x) * clampedMix;
              ballY = attacker.y + (goalY - attacker.y) * clampedMix - Math.sin(clampedMix * Math.PI) * 24;
            }
          } else {
            const idleRadiusX = tickerApp.screen.width * 0.08;
            const idleRadiusY = 26;
            ballX = tickerApp.screen.width / 2 + Math.sin(t * 2.2) * idleRadiusX;
            ballY = tickerApp.screen.height * 0.58 + Math.cos(t * 2.6) * idleRadiusY;
          }
          
          trail.clear();
          trail.setStrokeStyle({ width: 2, color: hexToNumber(aura), alpha: activeEvent ? 0.35 : 0.18 });
          trail.moveTo(ball.x, ball.y);
          trail.lineTo(ballX, ballY);
          trail.stroke();

          ball.x = ballX;
          ball.y = ballY;
        });

      } catch (error) {
        console.error("PIXI Init Error", error);
      }
    };

    initApp();

    return () => {
      mounted = false;
      const appToDestroy = appRef.current;
      appRef.current = null;
      if (!appToDestroy) return;
      const destroy = appToDestroy.destroy;
      if (typeof destroy === "function") {
        destroy.call(appToDestroy, true, { children: true });
      }
    };
  }, [aura, stadium, playerImage, opponentImage]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || goalPulse === 0) return;

    const burst = new PIXI.Graphics();
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height * 0.45;
    burst.circle(centerX, centerY, 50);
    burst.fill({ color: hexToNumber(aura), alpha: 0.7 });
    
    burst.setStrokeStyle({ width: 3, color: hexToNumber(aura), alpha: 0.8 });
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      const x = centerX + Math.cos(angle) * 80;
      const y = centerY + Math.sin(angle) * 50;
      burst.moveTo(centerX, centerY);
      burst.lineTo(x, y);
    }
    burst.stroke();
    app.stage.addChild(burst);

    let alpha = 1;
    let shakeTimer = 0;
    const shakeDuration = 20; // frames
    const shakeIntensity = 8;
    
    const originalStagePos = { x: app.stage.x, y: app.stage.y };

    const animate = () => {
      alpha -= 0.04;
      burst.alpha = alpha;
      burst.scale.set(1 + (1 - alpha) * 1.2);
      
      // Shake effect
      if (shakeTimer < shakeDuration) {
        app.stage.x = originalStagePos.x + (Math.random() - 0.5) * shakeIntensity;
        app.stage.y = originalStagePos.y + (Math.random() - 0.5) * shakeIntensity;
        shakeTimer++;
      } else {
        app.stage.x = originalStagePos.x;
        app.stage.y = originalStagePos.y;
      }

      if (alpha <= 0 && shakeTimer >= shakeDuration) {
        app.stage.removeChild(burst);
        app.stage.x = originalStagePos.x;
        app.stage.y = originalStagePos.y;
        app.ticker.remove(animate);
      }
    };
    app.ticker.add(animate);
  }, [goalPulse, aura]);

  return (
    <div className="relative w-full h-full group">
      <div ref={containerRef} className="w-full h-full" />
      
      <div className="absolute inset-0 pointer-events-none p-4">
        <div className="flex justify-between items-start">
           <div className="bg-black/60 backdrop-blur px-3 py-1 border-l-4 border-brand-gold skew-x-[-12deg]">
              <div className="skew-x-[12deg] flex items-center gap-2 text-white">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Live Arena</span>
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
           </div>
           <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] italic">
             Broadcast Opt-72
           </div>
        </div>
        
        <div className="absolute bottom-4 left-4 flex items-center gap-4">
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Environment</span>
              <span className="font-heading text-lg italic text-brand-gold uppercase">{stadium}</span>
           </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
    </div>
  );
}
