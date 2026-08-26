import React, { useRef, useEffect } from "react";
import { Compass } from "lucide-react";

export function EmotionRadar({ valence = 0, arousal = 0.5, moodColor = "#c084fc" }) {
  const canvasRef = useRef(null);
  const trailRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Dark Radar Grid Background
    ctx.fillStyle = "#090d1a";
    ctx.fillRect(0, 0, W, H);

    // Grid Crosshairs
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();

    // Concentric Guide Circles
    [0.3, 0.6, 0.9].forEach((r) => {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, (W / 2) * r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.stroke();
    });

    // Quadrant Corner Labels
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.textAlign = "left";
    ctx.fillText("EXCITED (+A)", 8, 14);
    ctx.textAlign = "right";
    ctx.fillText("JOYFUL (+V,+A)", W - 8, 14);
    ctx.textAlign = "left";
    ctx.fillText("DISTRESSED (-V)", 8, H - 8);
    ctx.textAlign = "right";
    ctx.fillText("CALM (+V,-A)", W - 8, H - 8);

    // Map Valence [-1, 1] -> [14, W - 14], Arousal [0, 1] -> [H - 14, 14]
    const targetX = ((valence + 1) / 2) * (W - 28) + 14;
    const targetY = (1 - arousal) * (H - 28) + 14;

    // Push to trail
    trailRef.current.push({ x: targetX, y: targetY, alpha: 1.0 });
    if (trailRef.current.length > 35) trailRef.current.shift();

    // Draw Continuous Glowing Comet Ribbon
    if (trailRef.current.length > 1) {
      ctx.save();
      for (let i = 1; i < trailRef.current.length; i++) {
        const p1 = trailRef.current[i - 1];
        const p2 = trailRef.current[i];
        const progress = i / trailRef.current.length;

        ctx.strokeStyle = moodColor;
        ctx.lineWidth = 1 + progress * 4;
        ctx.globalAlpha = progress * 0.7;
        ctx.shadowColor = moodColor;
        ctx.shadowBlur = progress * 10;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Main Target Cursor
    ctx.beginPath();
    ctx.arc(targetX, targetY, 7, 0, Math.PI * 2);
    ctx.fillStyle = moodColor;
    ctx.shadowColor = moodColor;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [valence, arousal, moodColor]);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Compass className="w-4 h-4 text-sky-400" />
          <span>2D Affective Vector Radar</span>
        </div>
        <div className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-400/20">
          Comet Trajectory
        </div>
      </div>

      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.12] shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} width={280} height={175} className="w-full h-full object-cover" />
      </div>

      {/* Axis Telemetry Readouts */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.1]">
          <span className="text-[10px] text-slate-400 block uppercase">Valence (X)</span>
          <b className={valence >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {valence >= 0 ? `+${valence.toFixed(2)}` : valence.toFixed(2)}
          </b>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-white/[0.1]">
          <span className="text-[10px] text-slate-400 block uppercase">Arousal (Y)</span>
          <b className="text-sky-400">{arousal.toFixed(2)}</b>
        </div>
      </div>
    </div>
  );
}
