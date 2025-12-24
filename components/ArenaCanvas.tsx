"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

function hexToNumber(hex: string) {
  return Number(`0x${hex.replace("#", "")}`);
}

type ArenaCanvasProps = {
  aura: string;
  stadium: string;
  goalPulse: number;
};

export default function ArenaCanvas({ aura, stadium, goalPulse }: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);

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

        const player = new PIXI.Graphics();
        player.circle(0, 0, 15);
        player.fill({ color: hexToNumber(aura) });
        player.x = app.screen.width * 0.35;
        player.y = app.screen.height * 0.62;
        arena.addChild(player);

        const ai = new PIXI.Graphics();
        ai.circle(0, 0, 15);
        ai.fill({ color: 0xff7bd8 });
        ai.x = app.screen.width * 0.65;
        ai.y = app.screen.height * 0.52;
        arena.addChild(ai);

        const ball = new PIXI.Graphics();
        ball.circle(0, 0, 6);
        ball.fill({ color: 0xffffff });
        ball.x = app.screen.width / 2;
        ball.y = app.screen.height * 0.58;
        arena.addChild(ball);

        const trail = new PIXI.Graphics();
        arena.addChild(trail);

        let t = 0;
        const tickerApp = app;
        app.ticker.add(() => {
          t += 0.01;
          const sway = Math.sin(t * 2) * 10;
          player.y = tickerApp.screen.height * 0.62 + sway;
          ai.y = tickerApp.screen.height * 0.52 - sway;

          const ballX = tickerApp.screen.width / 2 + Math.sin(t * 2.5) * tickerApp.screen.width * 0.22;
          const ballY = tickerApp.screen.height * 0.58 + Math.cos(t * 3) * 60;
          
          trail.clear();
          trail.setStrokeStyle({ width: 2, color: hexToNumber(aura), alpha: 0.4 });
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
  }, [aura, stadium]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

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
    const fade = () => {
      alpha -= 0.05;
      burst.alpha = alpha;
      burst.scale.set(1 + (1 - alpha) * 0.5);
      if (alpha <= 0) {
        app.stage.removeChild(burst);
        app.ticker.remove(fade);
      }
    };
    app.ticker.add(fade);
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
