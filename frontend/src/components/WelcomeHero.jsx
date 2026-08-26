import { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Eye, Compass, Volume2, Zap, ArrowRight, Cpu } from "lucide-react";
import { soundFX } from "../utils/audioFX";

const BOOT_STAGES = [
  { pct: 25, stage: 1, text: "⚡ Initializing Neural Tensor Bus & DeepFace Vision Engine..." },
  { pct: 50, stage: 2, text: "🧠 Loading Rolling-Window Emotional State & Context Memory..." },
  { pct: 75, stage: 3, text: "🧭 Calibrating 2D Russell Circumplex Vector Field..." },
  { pct: 100, stage: 4, text: "🔮 Synchronizing Empathic Response Orb & Speech Synthesis..." },
];

export function WelcomeHero({ onStart }) {
  const [isBooting, setIsBooting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("System in standby. Awaiting engagement...");

  const rainCanvasRef = useRef(null);
  const surgeCanvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isBootingRef = useRef(false);

  // Keep isBootingRef in sync for animation loop speed modulation
  useEffect(() => {
    isBootingRef.current = isBooting;
  }, [isBooting]);

  const triggerBoot = useCallback(() => {
    if (isBooting) return;
    soundFX.playClick();
    soundFX.playPowerUp(1);
    setIsBooting(true);
  }, [isBooting]);

  // Keyboard navigation (Space or Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        triggerBoot();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerBoot]);

  // Boot sequence timer & stage progression
  useEffect(() => {
    if (!isBooting) return;

    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += 2;
      if (currentPct > 100) currentPct = 100;
      setProgress(currentPct);

      const stageObj = BOOT_STAGES.find((s) => s.pct === currentPct);
      if (stageObj) {
        soundFX.playPowerUp(stageObj.stage);
        setCurrentStatus(stageObj.text);
      }

      if (currentPct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          soundFX.playScanLock();
          onStart();
        }, 500);
      }
    }, 45); // ~2.3 seconds total sequence

    return () => clearInterval(interval);
  }, [isBooting, onStart]);

  // Dual Canvas Animation: Red & Blue Matrix Rain + Circuital Power Surge
  useEffect(() => {
    const rainCanvas = rainCanvasRef.current;
    const surgeCanvas = surgeCanvasRef.current;
    if (!rainCanvas || !surgeCanvas) return;

    const rainCtx = rainCanvas.getContext("2d");
    const surgeCtx = surgeCanvas.getContext("2d");

    let width = (rainCanvas.width = surgeCanvas.width = window.innerWidth);
    let height = (rainCanvas.height = surgeCanvas.height = window.innerHeight);

    let cx = width / 2;
    let cy = height / 2;
    let maxRadius = Math.sqrt(cx * cx + cy * cy);

    const handleResize = () => {
      width = rainCanvas.width = surgeCanvas.width = window.innerWidth;
      height = rainCanvas.height = surgeCanvas.height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      maxRadius = Math.sqrt(cx * cx + cy * cy);
    };
    window.addEventListener("resize", handleResize);

    // 1. Dual Matrix Rain Setup
    const chars = "0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈ";
    const fontSize = 14;
    const cols = Math.floor(width / fontSize);
    const drops = Array(cols).fill(1);

    // 2. Power Surge Rings
    class SurgeRing {
      constructor() {
        this.reset();
      }
      reset() {
        this.r = 0;
        this.speed = 1.2 + Math.random() * 2.5;
        this.lineWidth = 1 + Math.random() * 2;
        this.isRed = Math.random() > 0.5;
        this.opacity = 0.35 + Math.random() * 0.35;
        this.dashLen = 8 + Math.random() * 30;
        this.gapLen = 4 + Math.random() * 20;
      }
      update(speedMultiplier) {
        this.r += this.speed * speedMultiplier;
        if (this.r > maxRadius + 50) this.reset();
      }
      draw(ctx) {
        const fade = 1 - this.r / maxRadius;
        if (fade <= 0) return;
        const color = this.isRed
          ? `rgba(244, 63, 94, ${this.opacity * fade})`
          : `rgba(56, 189, 248, ${this.opacity * fade})`;
        ctx.beginPath();
        ctx.arc(cx, cy, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = this.lineWidth * fade;
        ctx.setLineDash([this.dashLen, this.gapLen]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. Electric Lightning Arcs
    class ElectricArc {
      constructor() {
        this.reset();
      }
      reset() {
        this.angle = Math.random() * Math.PI * 2;
        this.length = 80 + Math.random() * (maxRadius * 0.75);
        this.life = 0;
        this.maxLife = 12 + Math.random() * 18;
        this.isRed = Math.random() > 0.5;
        this.segments = [];
        this.generate();
      }
      generate() {
        this.segments = [];
        const steps = 12 + Math.floor(Math.random() * 20);
        let px = cx,
          py = cy;
        for (let i = 0; i < steps; i++) {
          const frac = (i + 1) / steps;
          const nx = cx + Math.cos(this.angle) * this.length * frac + (Math.random() - 0.5) * 40;
          const ny = cy + Math.sin(this.angle) * this.length * frac + (Math.random() - 0.5) * 40;
          this.segments.push({ x1: px, y1: py, x2: nx, y2: ny });
          px = nx;
          py = ny;
          if (Math.random() > 0.7) {
            const ba = this.angle + (Math.random() - 0.5) * 1.2;
            const bl = 20 + Math.random() * 60;
            const bx = nx + Math.cos(ba) * bl;
            const by = ny + Math.sin(ba) * bl;
            this.segments.push({ x1: nx, y1: ny, x2: bx, y2: by, branch: true });
          }
        }
      }
      update(speedMultiplier) {
        this.life += 1 * speedMultiplier;
        if (this.life > this.maxLife) this.reset();
      }
      draw(ctx) {
        const fade = 1 - this.life / this.maxLife;
        if (fade <= 0) return;
        const base = this.isRed ? [244, 63, 94] : [56, 189, 248];
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${base[0]},${base[1]},${base[2]},0.6)`;
        for (const seg of this.segments) {
          const alpha = seg.branch ? fade * 0.4 : fade * 0.8;
          ctx.strokeStyle = `rgba(${base[0]},${base[1]},${base[2]},${alpha})`;
          ctx.lineWidth = seg.branch ? 0.8 : 1.5;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }

    // 4. PCB Circuit Traces
    class CircuitTrace {
      constructor() {
        this.reset();
      }
      reset() {
        this.progress = 0;
        this.speed = 2 + Math.random() * 4;
        this.isRed = Math.random() > 0.5;
        this.opacity = 0.15 + Math.random() * 0.25;
        this.points = [];
        let px = cx,
          py = cy;
        const totalSegs = 4 + Math.floor(Math.random() * 6);
        let d = Math.floor(Math.random() * 4); // 0=R, 1=D, 2=L, 3=U
        for (let i = 0; i < totalSegs; i++) {
          const segLen = 30 + Math.random() * 120;
          let nx = px,
            ny = py;
          if (d === 0) nx += segLen;
          else if (d === 1) ny += segLen;
          else if (d === 2) nx -= segLen;
          else ny -= segLen;
          this.points.push({ x1: px, y1: py, x2: nx, y2: ny });
          px = nx;
          py = ny;
          d = (d + (Math.random() > 0.5 ? 1 : 3)) % 4;
        }
        this.totalLen = this.points.reduce(
          (s, p) => s + Math.sqrt((p.x2 - p.x1) ** 2 + (p.y2 - p.y1) ** 2),
          0
        );
      }
      update(speedMultiplier) {
        this.progress += this.speed * speedMultiplier;
        if (this.progress > this.totalLen + 60) this.reset();
      }
      draw(ctx) {
        const base = this.isRed ? [244, 63, 94] : [56, 189, 248];
        let accum = 0;
        for (const seg of this.points) {
          const segLen = Math.sqrt((seg.x2 - seg.x1) ** 2 + (seg.y2 - seg.y1) ** 2);
          const segStart = accum;
          const segEnd = accum + segLen;
          accum += segLen;
          if (this.progress < segStart) break;
          const drawFrac = Math.min(1, (this.progress - segStart) / segLen);
          const ex = seg.x1 + (seg.x2 - seg.x1) * drawFrac;
          const ey = seg.y1 + (seg.y2 - seg.y1) * drawFrac;
          const distFromHead = this.progress - segEnd;
          const fadeTail = distFromHead > 0 ? Math.max(0, 1 - distFromHead / 120) : 1;

          ctx.strokeStyle = `rgba(${base[0]},${base[1]},${base[2]},${this.opacity * fadeTail})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          if (drawFrac < 1 || (drawFrac === 1 && distFromHead < 30)) {
            ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${0.9 * fadeTail})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = `rgba(${base[0]},${base[1]},${base[2]},0.8)`;
            ctx.beginPath();
            ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          if (drawFrac >= 1) {
            ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${0.3 * fadeTail})`;
            ctx.beginPath();
            ctx.arc(seg.x2, seg.y2, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    const surgeRings = Array.from({ length: 8 }, () => {
      const r = new SurgeRing();
      r.r = Math.random() * maxRadius;
      return r;
    });
    const arcs = Array.from({ length: 7 }, () => {
      const a = new ElectricArc();
      a.life = Math.floor(Math.random() * a.maxLife);
      return a;
    });
    const circuits = Array.from({ length: 18 }, () => {
      const t = new CircuitTrace();
      t.progress = Math.random() * t.totalLen;
      return t;
    });

    let rainCounter = 0;

    const render = () => {
      const speedMultiplier = isBootingRef.current ? 2.2 : 1.0;

      // 1. Render Matrix Rain (every 2 frames for smooth retro effect)
      rainCounter++;
      if (rainCounter % 2 === 0) {
        rainCtx.fillStyle = "rgba(5, 7, 17, 0.12)";
        rainCtx.fillRect(0, 0, width, height);
        rainCtx.font = fontSize + "px 'JetBrains Mono', monospace";
        for (let i = 0; i < drops.length; i++) {
          const text = chars.charAt(Math.floor(Math.random() * chars.length));
          rainCtx.fillStyle = i % 2 === 0 ? "rgba(244, 63, 94, 0.7)" : "rgba(56, 189, 248, 0.7)";
          rainCtx.fillText(text, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
          drops[i] += isBootingRef.current ? 1.5 : 1;
        }
      }

      // 2. Render Power Surge Canvas
      surgeCtx.clearRect(0, 0, width, height);

      // Ambient radial core illumination
      const coreGrad = surgeCtx.createRadialGradient(cx, cy, 0, cx, cy, isBootingRef.current ? 320 : 220);
      coreGrad.addColorStop(0, isBootingRef.current ? "rgba(244, 63, 94, 0.22)" : "rgba(168, 85, 247, 0.12)");
      coreGrad.addColorStop(0.3, "rgba(244, 63, 94, 0.06)");
      coreGrad.addColorStop(0.6, "rgba(56, 189, 248, 0.03)");
      coreGrad.addColorStop(1, "transparent");
      surgeCtx.fillStyle = coreGrad;
      surgeCtx.fillRect(0, 0, width, height);

      // Expand and draw all components
      for (const ring of surgeRings) {
        ring.update(speedMultiplier);
        ring.draw(surgeCtx);
      }
      for (const arc of arcs) {
        arc.update(speedMultiplier);
        arc.draw(surgeCtx);
      }
      for (const ct of circuits) {
        ct.update(speedMultiplier);
        ct.draw(surgeCtx);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050711] backdrop-blur-2xl overflow-y-auto selection:bg-rose-500 selection:text-white">
      {/* Layer 0: Dual Red & Blue Matrix Rain Canvas */}
      <canvas
        ref={rainCanvasRef}
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none z-0"
      />

      {/* Layer 1: Full-Screen Circuital Power Surge Canvas */}
      <canvas
        ref={surgeCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-1"
      />

      {/* Ambient Red/Blue Atmospheric Light Wells */}
      <div className="absolute w-[650px] h-[650px] rounded-full bg-rose-600/15 blur-[180px] pointer-events-none -top-20 -left-20 z-0" />
      <div className="absolute w-[650px] h-[650px] rounded-full bg-sky-600/15 blur-[180px] pointer-events-none -bottom-20 -right-20 z-0" />

      {/* Main Glassmorphic Quantum Arc Card */}
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-slate-950/90 border border-white/[0.15] p-8 md:p-12 shadow-[0_0_100px_rgba(244,63,94,0.25),0_0_100px_rgba(56,189,248,0.25)] flex flex-col items-center text-center gap-8 backdrop-blur-2xl">
        
        {/* Top Telemetry Header */}
        <div className="flex items-center justify-between w-full border-b border-white/[0.1] pb-4 text-xs font-mono">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400 tracking-wider uppercase">RED</span>
            <span className="text-slate-500">•</span>
            <span className="text-sky-400 tracking-wider uppercase">BLUE</span>
            <span className="text-slate-400 font-normal">NEURAL FUSION // MK-85</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            VALENCE: <span className="text-rose-400 font-bold">ACTIVE</span> • AROUSAL:{" "}
            <span className="text-sky-400 font-bold">SYNCED</span>
          </div>
        </div>

        {/* Stark Arc Reactor Turbine with Alternating Red & Blue Coils */}
        <div className="relative flex items-center justify-center w-64 h-64 my-1">
          {/* Outermost Segmented Ring */}
          <svg
            className={`absolute inset-0 w-full h-full pointer-events-none transition-all duration-700 ${
              isBooting ? "animate-spin [animation-duration:4s]" : "animate-spin-slow"
            }`}
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="none"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="1.5"
              strokeDasharray="6, 6"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="rgba(244, 63, 94, 0.55)"
              strokeWidth="3"
              strokeDasharray="18, 10"
            />
          </svg>

          {/* Counter-Rotating Middle Turbine with 8 Alternating Magnetic Coils */}
          <svg
            className={`absolute inset-4 w-56 h-56 pointer-events-none transition-all duration-700 ${
              isBooting ? "animate-spin-reverse [animation-duration:2.5s]" : "animate-spin-reverse"
            }`}
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
              strokeDasharray="32, 12"
            />
            <g strokeWidth="3.5">
              <line x1="100" y1="18" x2="100" y2="30" stroke="#f43f5e" />
              <line x1="100" y1="170" x2="100" y2="182" stroke="#f43f5e" />
              <line x1="18" y1="100" x2="30" y2="100" stroke="#38bdf8" />
              <line x1="170" y1="100" x2="182" y2="100" stroke="#38bdf8" />
              <line x1="42" y1="42" x2="50" y2="50" stroke="#f43f5e" />
              <line x1="158" y1="158" x2="150" y2="150" stroke="#f43f5e" />
              <line x1="158" y1="42" x2="150" y2="50" stroke="#38bdf8" />
              <line x1="42" y1="158" x2="50" y2="150" stroke="#38bdf8" />
            </g>
          </svg>

          {/* Pure Radiant Plasma Singularity Core (Zero text inside) */}
          <div
            className={`relative w-28 h-28 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-sky-400 flex items-center justify-center transition-all duration-700 ${
              isBooting
                ? "scale-115 shadow-[0_0_80px_#f43f5e,0_0_110px_#38bdf8]"
                : "shadow-[0_0_50px_rgba(244,63,94,0.6),0_0_70px_rgba(56,189,248,0.6)]"
            }`}
          >
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(192,132,252,0.6) 45%, transparent 75%)",
              }}
            />
          </div>
        </div>

        {/* Branding & Subtitle */}
        <div className="flex flex-col gap-2.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-bold uppercase tracking-wider mx-auto">
            <Cpu className="w-3.5 h-3.5 text-rose-400" />
            <span>Deep Learning Track • Adaptive AI Mirror</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-purple-200 to-sky-400 bg-clip-text text-transparent">
            REFLECTRA
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
            Adaptive Multi-Agent Biometric Emotion Mirror with 2D Russell Circumplex Vector Modeling & Empathic Voice Reflection.
          </p>
        </div>

        {/* Diagnostic Terminal or Telemetry Badges */}
        {isBooting ? (
          <div className="w-full p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40 flex flex-col gap-3 font-mono text-left animate-fade-in shadow-[0_0_30px_rgba(56,189,248,0.2)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                POWER SURGE IN PROGRESS
              </span>
              <span className="text-emerald-400 font-bold">{progress}% ENERGIZED</span>
            </div>

            {/* Glowing Gradient Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-purple-500 to-sky-400 transition-all duration-75 shadow-[0_0_15px_#38bdf8]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-slate-300 italic pt-1">{currentStatus}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-rose-400/40 transition">
              <Brain className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-bold text-slate-200">5-Agent Engine</span>
              <span className="text-[10px] text-slate-400 font-mono">Vision ➔ LLM</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-sky-400/40 transition">
              <Eye className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">DeepFace HUD</span>
              <span className="text-[10px] text-slate-400 font-mono">5 Hz Sampling</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-purple-400/40 transition">
              <Compass className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">Russell Radar</span>
              <span className="text-[10px] text-slate-400 font-mono">Valence vs Arousal</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-emerald-400/40 transition">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Living Orb & Voice</span>
              <span className="text-[10px] text-slate-400 font-mono">Hume AI Style</span>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        {!isBooting && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <button
              onClick={triggerBoot}
              className="w-full py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-rose-600 via-purple-600 to-sky-500 hover:from-rose-500 hover:to-sky-400 shadow-[0_0_40px_rgba(244,63,94,0.5),0_0_40px_rgba(56,189,248,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-amber-300" />
              <span>⚡ INITIALIZE REFLECTRA</span>
              <ArrowRight className="w-5 h-5 text-sky-200" />
            </button>

            <span className="text-xs font-mono text-slate-400">
              PRESS <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-rose-300 font-bold">SPACE</kbd> OR <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-sky-300 font-bold">ENTER</kbd> TO ENGAGE DUAL SYSTEM
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
