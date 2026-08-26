import React, { useRef, useEffect } from "react";

const MOOD_GRADIENTS = {
  happy: { core: "#10b981", outer: "#f59e0b", glow: "rgba(16, 185, 129, 0.45)" },
  sad: { core: "#3b82f6", outer: "#818cf8", glow: "rgba(59, 130, 246, 0.45)" },
  surprise: { core: "#a855f7", outer: "#f43f5e", glow: "rgba(168, 85, 247, 0.45)" },
  angry: { core: "#ef4444", outer: "#f97316", glow: "rgba(239, 68, 68, 0.45)" },
  fear: { core: "#c084fc", outer: "#38bdf8", glow: "rgba(192, 132, 252, 0.45)" },
  disgust: { core: "#84cc16", outer: "#10b981", glow: "rgba(132, 204, 22, 0.45)" },
  neutral: { core: "#64748b", outer: "#38bdf8", glow: "rgba(100, 116, 139, 0.35)" },
};

export function LivingEmotionOrb({
  dominantMood = "neutral",
  valence = 0,
  arousal = 0.5,
  stability = 0.8,
  isSpeaking = false,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const particles = Array.from({ length: 24 }, () => ({
      x: 0,
      y: 0,
      angle: Math.random() * Math.PI * 2,
      dist: 30 + Math.random() * 35,
      speed: 0.01 + Math.random() * 0.02,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.6,
    }));

    const render = (timeMs) => {
      animId = requestAnimationFrame(render);
      const time = timeMs * 0.002;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      ctx.clearRect(0, 0, W, H);

      const theme = MOOD_GRADIENTS[dominantMood] || MOOD_GRADIENTS.neutral;
      const baseRadius = 38 + (isSpeaking ? Math.sin(time * 8) * 6 : 0) + arousal * 8 + valence * 3;
      const turbulence = 6 + (1 - stability) * 12 + (isSpeaking ? 8 : 0);
      const speed = 0.8 + arousal * 1.6 + Math.abs(valence) * 0.4;

      // 1. Outer Ambient Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 2.2);
      glowGrad.addColorStop(0, theme.glow);
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Morphing Fluid Polygon
      ctx.save();
      ctx.beginPath();
      const numPoints = 64;
      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        // Multi-frequency wave deformation
        const noise =
          Math.sin(theta * 3 + time * speed) * turbulence * 0.6 +
          Math.cos(theta * 5 - time * speed * 1.3) * turbulence * 0.4 +
          Math.sin(theta * 7 + time * 3) * (isSpeaking ? 4 : 1);

        const r = baseRadius + noise;
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Core Gradient
      const coreGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.3,
        cy - baseRadius * 0.3,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius * 1.4
      );
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.3, theme.core);
      coreGrad.addColorStop(0.85, theme.outer);
      coreGrad.addColorStop(1, "rgba(15, 23, 42, 0.9)");

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = theme.core;
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();

      // 3. Floating Orbital Particles
      particles.forEach((p) => {
        p.angle += p.speed * speed;
        const px = cx + Math.cos(p.angle) * (baseRadius + p.dist * 0.5);
        const py = cy + Math.sin(p.angle) * (baseRadius + p.dist * 0.5);

        ctx.fillStyle = theme.outer;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    };

    animId = requestAnimationFrame(render);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [dominantMood, valence, arousal, stability, isSpeaking]);

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none">
      <canvas ref={canvasRef} width={200} height={150} className="w-[180px] h-[135px]" />
    </div>
  );
}
