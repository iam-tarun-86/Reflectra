import React, { useRef, useEffect } from "react";
import { TrendingUp } from "lucide-react";

const MOOD_COLORS = {
  happy: "#10b981",
  sad: "#3b82f6",
  angry: "#ef4444",
  surprise: "#f59e0b",
  fear: "#a855f7",
  disgust: "#84cc16",
  neutral: "#64748b",
};

export function TimelineStream({ timelineData = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !timelineData.length) return;
    const ctx = canvas.getContext("2d");

    // Adjust for High-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Dark Background
    ctx.fillStyle = "#040508";
    ctx.fillRect(0, 0, W, H);

    // Center Baseline Axis
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    const windowSec = 60;
    const now = timelineData[timelineData.length - 1].t;
    const startT = Math.max(0, now - windowSec);

    // Draw Emotion Blocks
    timelineData.forEach((pt) => {
      if (pt.t < startT) return;
      const x = ((pt.t - startT) / windowSec) * W;
      const w = Math.max(3 * dpr, (W / windowSec) * 0.9);
      const col = MOOD_COLORS[pt.emotion] || "#64748b";

      const blockH = (14 + pt.stability * 36) * dpr;
      const y = H / 2 - blockH / 2;

      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, blockH);

      // Shift Marker
      if (pt.shift) {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        const dotY = Math.max(6 * dpr, y - 4 * dpr);
        ctx.arc(x + w / 2, dotY, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw Smooth Continuous Valence Wave Curve
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2 * dpr;
    let isFirst = true;

    timelineData.forEach((pt) => {
      if (pt.t < startT) return;
      const x = ((pt.t - startT) / windowSec) * W;
      const val = pt.valence !== undefined ? pt.valence : 0;
      const y = H / 2 - val * (H * 0.38);
      if (isFirst) {
        ctx.moveTo(x, y);
        isFirst = false;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }, [timelineData]);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>60-Second Real-Time Emotion & Valence Timeline</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          {timelineData.length} points • 60s window
        </div>
      </div>

      <div className="relative w-full h-[70px] rounded-xl overflow-hidden border border-white/[0.08] bg-[#040508]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(MOOD_COLORS).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1 capitalize">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
        <span className="font-mono text-[10px]">Height: Stability % • Curve: Valence</span>
      </div>
    </div>
  );
}
