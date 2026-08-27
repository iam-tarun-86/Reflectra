import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Zap, Volume2, VolumeX, Cpu, Brain, Eye, Compass, Activity } from "lucide-react";
import { soundFX } from "../utils/audioFX";

const CHROMATIC_STAGES = [
  {
    min: 0,
    max: 25,
    stage: 1,
    name: "CRYO CYAN",
    tag: "SPECTRUM: CRYO COLD",
    primary: "#38bdf8",
    secondary: "#0284c7",
    glow: "rgba(56, 189, 248, 0.45)",
    voltage: "120.0 V",
    freq: "60 Hz",
    state: "INITIALIZING",
    status: "Magnetic coil stator charging (120V ➔ 480V)...",
  },
  {
    min: 25,
    max: 50,
    stage: 2,
    name: "NEURAL VIOLET",
    tag: "SPECTRUM: NEURAL VIOLET",
    primary: "#c084fc",
    secondary: "#f43f5e",
    glow: "rgba(192, 132, 252, 0.55)",
    voltage: "1.21 kV",
    freq: "240 Hz",
    state: "TENSOR ALIGNED",
    status: "Subtle background bus engaged across 16 tracks...",
  },
  {
    min: 50,
    max: 75,
    stage: 3,
    name: "SOLAR AMBER",
    tag: "SPECTRUM: SOLAR AMBER",
    primary: "#fbbf24",
    secondary: "#f97316",
    glow: "rgba(251, 191, 36, 0.55)",
    voltage: "4.80 kV",
    freq: "440 Hz",
    state: "AFFECTIVE HARMONY",
    status: "Circumplex affective vector plane synchronized...",
  },
  {
    min: 75,
    max: 100,
    stage: 4,
    name: "EMERALD SUPERNOVA",
    tag: "SPECTRUM: EMERALD HARMONY",
    primary: "#10b981",
    secondary: "#34d399",
    glow: "rgba(16, 185, 129, 0.65)",
    voltage: "10.0 kV",
    freq: "880 Hz",
    state: "EMPATHIC COHERENCE",
    status: "Supercharged! Neural Mirror Core 100% Operational.",
  },
];

function getCurrentStageTheme(pct) {
  if (pct < 25) return CHROMATIC_STAGES[0];
  if (pct < 50) return CHROMATIC_STAGES[1];
  if (pct < 75) return CHROMATIC_STAGES[2];
  return CHROMATIC_STAGES[3];
}

export function WelcomeHero({ onStart }) {
  const [isBooting, setIsBooting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const rainCanvasRef = useRef(null);
  const circuitCanvasRef = useRef(null);
  const hybridOrbCanvasRef = useRef(null);
  const irisBladesRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isBootingRef = useRef(false);
  const progressRef = useRef(0);

  // Keep refs in sync for the high-frequency canvas render loop
  useEffect(() => {
    isBootingRef.current = isBooting;
    progressRef.current = progress;
  }, [isBooting, progress]);

  // Audio mute toggle
  const toggleAudio = useCallback(() => {
    soundFX.ensureContext();
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundFX.playClick();
    }
  }, []);

  // Trigger boot sequence with continuous audio charge
  const triggerBoot = useCallback(() => {
    if (isBooting) return;
    soundFX.ensureContext();
    soundFX.playClick();
    setIsBooting(true);

    const TOTAL_SURGE_SEC = 2.8;
    soundFX.startContinuousSurge(TOTAL_SURGE_SEC);
  }, [isBooting]);

  // Keyboard engagement (Space / Enter)
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

  // Power Surge Timer & Milestone Coordination
  useEffect(() => {
    if (!isBooting) return;

    let currentPct = 0;
    let lastMilestone = 0;

    const interval = setInterval(() => {
      currentPct += 1;
      if (currentPct > 100) currentPct = 100;
      setProgress(currentPct);

      // Trigger chord milestones at 25%, 50%, 75%
      const stageIdx = Math.floor(currentPct / 25);
      if (stageIdx > lastMilestone && stageIdx <= 3) {
        lastMilestone = stageIdx;
        soundFX.playMilestone(stageIdx);
      }

      if (currentPct >= 100) {
        clearInterval(interval);
        soundFX.stopContinuousSurge();
        soundFX.playSupernovaCompletion();

        setTimeout(() => {
          onStart();
        }, 800);
      }
    }, 28); // ~2.8 seconds total smooth power surge

    return () => clearInterval(interval);
  }, [isBooting, onStart]);

  // Dual Canvas Rendering Engine: Background Matrix Rain + Subtle Background PCB Circuit Network
  useEffect(() => {
    const rainCanvas = rainCanvasRef.current;
    const circuitCanvas = circuitCanvasRef.current;
    if (!rainCanvas || !circuitCanvas) return;

    const rainCtx = rainCanvas.getContext("2d");
    const circuitCtx = circuitCanvas.getContext("2d");

    let width = (rainCanvas.width = circuitCanvas.width = window.innerWidth);
    let height = (rainCanvas.height = circuitCanvas.height = window.innerHeight);

    // 1. Matrix Digital Rain Setup
    const chars = "0123456789ABCDEFΣΩΨΦ⚡Ξλ0101".split("");
    const fontSize = 14;
    let cols = Math.floor(width / fontSize);
    let drops = Array(cols)
      .fill(1)
      .map(() => Math.random() * -80);

    // 2. Clean 16-Bus Background PCB Motherboard Network
    const NUM_TRACES = 16;
    let pcbTraces = [];

    const buildPcbNetwork = () => {
      const maxDiag = Math.hypot(width, height) * 0.65;
      pcbTraces = Array.from({ length: NUM_TRACES }, (_, i) => {
        const baseAngle = (i / NUM_TRACES) * Math.PI * 2 + Math.PI / 16;
        const rStart = 110;
        const r1 = rStart + 60 + (i % 3) * 40;
        const r2 = r1 + 120 + (i % 2) * 60;
        const r3 = maxDiag * 1.15;

        const bendDir = i % 2 === 0 ? 1 : -1;
        const turnAngle = baseAngle + (Math.PI / 6) * bendDir;

        return {
          baseAngle,
          rStart,
          r1,
          r2,
          r3,
          turnAngle,
          pulseOffset: (i * 25) % 100,
          pulseSpeed: 1.2 + (i % 3) * 0.4,
        };
      });
    };

    const handleResize = () => {
      width = rainCanvas.width = circuitCanvas.width = window.innerWidth;
      height = rainCanvas.height = circuitCanvas.height = window.innerHeight;
      cols = Math.floor(width / fontSize);
      drops = Array(cols)
        .fill(1)
        .map(() => Math.random() * -80);
      buildPcbNetwork();
    };

    window.addEventListener("resize", handleResize);
    buildPcbNetwork();

    const getPcbPoint = (cx, cy, trace, prog) => {
      const x0 = cx + Math.cos(trace.baseAngle) * trace.rStart;
      const y0 = cy + Math.sin(trace.baseAngle) * trace.rStart;

      const x1 = cx + Math.cos(trace.baseAngle) * trace.r1;
      const y1 = cy + Math.sin(trace.baseAngle) * trace.r1;

      const x2 = x1 + Math.cos(trace.turnAngle) * (trace.r2 - trace.r1);
      const y2 = y1 + Math.sin(trace.turnAngle) * (trace.r2 - trace.r1);

      const x3 = x2 + Math.cos(trace.baseAngle) * (trace.r3 - trace.r2);
      const y3 = y2 + Math.sin(trace.baseAngle) * (trace.r3 - trace.r2);

      if (prog < 0.33) {
        const t = prog / 0.33;
        return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
      } else if (prog < 0.66) {
        const t = (prog - 0.33) / 0.33;
        return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
      } else {
        const t = (prog - 0.66) / 0.34;
        return { x: x2 + (x3 - x2) * t, y: y2 + (y3 - y2) * t };
      }
    };

    // Master Animation Render Loop
    let rainCounter = 0;
    const render = (timestamp) => {
      const curProgress = progressRef.current;
      const theme = getCurrentStageTheme(curProgress);
      const surging = isBootingRef.current;
      const time = timestamp * 0.003;
      const cx = width / 2;
      const cy = height / 2;

      // 1. Render Matrix Digital Rain (every 2 frames for smooth performance)
      rainCounter++;
      if (rainCounter % 2 === 0) {
        rainCtx.fillStyle = "rgba(3, 7, 18, 0.12)";
        rainCtx.fillRect(0, 0, width, height);
        rainCtx.font = `${fontSize}px 'JetBrains Mono', monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const isAlt = i % 2 === 0;
          rainCtx.fillStyle = isAlt ? theme.primary : theme.secondary;
          rainCtx.shadowColor = theme.primary;
          rainCtx.shadowBlur = surging ? 8 : 2;

          rainCtx.fillText(char, x, y);

          const speed = surging ? 1.5 : 0.7;
          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i] += speed;
        }
      }

      // 2. Render Subtle Background PCB Circuit Network
      circuitCtx.clearRect(0, 0, width, height);

      pcbTraces.forEach((trace, idx) => {
        const x0 = cx + Math.cos(trace.baseAngle) * trace.rStart;
        const y0 = cy + Math.sin(trace.baseAngle) * trace.rStart;

        const x1 = cx + Math.cos(trace.baseAngle) * trace.r1;
        const y1 = cy + Math.sin(trace.baseAngle) * trace.r1;

        const x2 = x1 + Math.cos(trace.turnAngle) * (trace.r2 - trace.r1);
        const y2 = y1 + Math.sin(trace.turnAngle) * (trace.r2 - trace.r1);

        const x3 = x2 + Math.cos(trace.baseAngle) * (trace.r3 - trace.r2);
        const y3 = y2 + Math.sin(trace.baseAngle) * (trace.r3 - trace.r2);

        const traceColor = idx % 2 === 0 ? theme.primary : theme.secondary;

        // Subtle background hairline copper trace
        circuitCtx.beginPath();
        circuitCtx.moveTo(x0, y0);
        circuitCtx.lineTo(x1, y1);
        circuitCtx.lineTo(x2, y2);
        circuitCtx.lineTo(x3, y3);
        circuitCtx.strokeStyle = surging
          ? "rgba(255, 255, 255, 0.12)"
          : "rgba(255, 255, 255, 0.04)";
        circuitCtx.lineWidth = surging ? 1.5 : 1.0;
        circuitCtx.stroke();

        // Small micro via test points
        [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((pt) => {
          circuitCtx.beginPath();
          circuitCtx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          circuitCtx.fillStyle = surging ? traceColor : "rgba(255, 255, 255, 0.15)";
          circuitCtx.fill();
        });

        // Edge terminal pad
        circuitCtx.beginPath();
        circuitCtx.arc(x3, y3, surging ? 3.5 : 2.5, 0, Math.PI * 2);
        circuitCtx.fillStyle = surging ? traceColor : "rgba(255, 255, 255, 0.2)";
        circuitCtx.fill();

        // Smooth glowing electron packet
        const surgeMultiplier = surging ? 3.5 : 1.0;
        const prog = ((time * trace.pulseSpeed * surgeMultiplier + trace.pulseOffset) % 100) / 100;
        const pt = getPcbPoint(cx, cy, trace, prog);

        circuitCtx.beginPath();
        circuitCtx.arc(pt.x, pt.y, surging ? 4 : 2.5, 0, Math.PI * 2);
        circuitCtx.fillStyle = traceColor;
        circuitCtx.shadowColor = traceColor;
        circuitCtx.shadowBlur = surging ? 14 : 5;
        circuitCtx.fill();
      });

      // 3. Render Center Nested Living Liquid Emotion Orb
      const orbCanvas = hybridOrbCanvasRef.current;
      if (orbCanvas) {
        const orbCtx = orbCanvas.getContext("2d");
        const orbW = orbCanvas.width;
        const orbH = orbCanvas.height;
        const ocx = orbW / 2;
        const ocy = orbH / 2;

        orbCtx.clearRect(0, 0, orbW, orbH);

        const numPoints = 8;
        const baseRadius = surging ? 28 : 22;
        const deformation = surging ? 10 : 5;

        orbCtx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const wave = Math.sin(angle * 3 + time * (surging ? 7 : 2.5)) * deformation;
          const r = baseRadius + wave;
          const ox = ocx + Math.cos(angle) * r;
          const oy = ocy + Math.sin(angle) * r;

          if (i === 0) orbCtx.moveTo(ox, oy);
          else orbCtx.lineTo(ox, oy);
        }
        orbCtx.closePath();

        const grad = orbCtx.createRadialGradient(ocx, ocy, 3, ocx, ocy, 42);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.35, theme.primary);
        grad.addColorStop(0.8, theme.secondary);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        orbCtx.fillStyle = grad;
        orbCtx.shadowColor = theme.primary;
        orbCtx.shadowBlur = surging ? 28 : 14;
        orbCtx.fill();
      }

      // 4. Update Prismatic Iris Blade Aperture Dilation
      if (irisBladesRef.current) {
        const scale = 1.0 + (curProgress / 100) * 0.22;
        const rotate = (curProgress / 100) * 45;
        irisBladesRef.current.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const currentTheme = getCurrentStageTheme(progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712] overflow-hidden select-none">
      {/* Layer 0: Matrix Digital Rain Canvas */}
      <canvas
        ref={rainCanvasRef}
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0"
      />

      {/* Layer 1: Subtle Background PCB Circuit Network */}
      <canvas
        ref={circuitCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-1 opacity-60"
      />

      {/* CRT Scanline Filter */}
      <div className="scanlines absolute inset-0 pointer-events-none opacity-25 z-2" />

      {/* Dynamic Ambient Glow Blooms */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none -top-24 -left-24 transition-colors duration-700 z-0"
        style={{
          backgroundColor: isBooting
            ? `${currentTheme.primary}22`
            : "rgba(56, 189, 248, 0.15)",
        }}
      />
      <div
        className="absolute w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none -bottom-24 -right-24 transition-colors duration-700 z-0"
        style={{
          backgroundColor: isBooting
            ? `${currentTheme.secondary}22`
            : "rgba(59, 130, 246, 0.15)",
        }}
      />

      {/* === FLOATING SPATIAL HOLOGRAPHIC HUD (ZERO BOX / PURE DEPTH) === */}
      <main className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center gap-6 transition-all duration-300">
        {/* Top Floating Header Bar */}
        <header className="flex items-center justify-between w-full border-b border-white/[0.1] pb-3 text-xs font-mono backdrop-blur-sm px-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full transition-colors duration-300 shadow-md"
              style={{
                backgroundColor: currentTheme.primary,
                boxShadow: `0 0 10px ${currentTheme.primary}`,
              }}
            />
            <span
              className="font-bold tracking-wider transition-colors duration-300"
              style={{
                color: currentTheme.primary,
                textShadow: `0 0 20px ${currentTheme.primary}`,
              }}
            >
              REFLECTRA
            </span>
            <span className="text-slate-600">/</span>
            <span
              className="font-bold tracking-wider transition-colors duration-300"
              style={{ color: currentTheme.primary }}
            >
              {currentTheme.tag}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span
              className="font-bold font-mono transition-colors duration-300"
              style={{ color: currentTheme.primary }}
            >
              {`${currentTheme.voltage} // ${currentTheme.state}`}
            </span>
            <button
              onClick={toggleAudio}
              className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 transition flex items-center gap-1.5 cursor-pointer border border-white/[0.1]"
              title="Toggle Audio Feedback"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="font-bold text-[10px]">
                {isMuted ? "AUDIO: OFF" : "AUDIO: ON"}
              </span>
            </button>
          </div>
        </header>

        {/* Center Prismatic Liquid Core (Floating in Space) */}
        <section
          aria-label="Center Core Display"
          className="relative flex items-center justify-center w-64 h-64 my-1"
        >
          {/* Outermost Stator Ring */}
          <svg
            className={`absolute inset-0 w-full h-full pointer-events-none transition-all duration-700 ${
              isBooting ? "animate-spin [animation-duration:3.5s]" : "animate-spin-slow"
            }`}
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="none"
              stroke={currentTheme.primary}
              strokeWidth="1.5"
              strokeDasharray="6, 6"
              opacity="0.4"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={currentTheme.secondary}
              strokeWidth="2.5"
              strokeDasharray="20, 10"
              opacity="0.65"
            />
          </svg>

          {/* Counter-Rotating Rotor Solenoid Coils */}
          <svg
            className={`absolute inset-2 w-60 h-60 pointer-events-none transition-all duration-700 ${
              isBooting
                ? "animate-spin-reverse [animation-duration:2.2s]"
                : "animate-spin-reverse"
            }`}
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.5"
              strokeDasharray="24, 12"
            />
            <g strokeWidth="2.5">
              <line x1="100" y1="18" x2="100" y2="28" stroke={currentTheme.primary} />
              <line x1="100" y1="172" x2="100" y2="182" stroke={currentTheme.primary} />
              <line x1="18" y1="100" x2="28" y2="100" stroke={currentTheme.secondary} />
              <line x1="172" y1="100" x2="182" y2="100" stroke={currentTheme.secondary} />
              <line x1="42" y1="42" x2="50" y2="50" stroke={currentTheme.primary} />
              <line x1="158" y1="158" x2="150" y2="150" stroke={currentTheme.primary} />
              <line x1="158" y1="42" x2="150" y2="50" stroke={currentTheme.secondary} />
              <line x1="42" y1="158" x2="50" y2="150" stroke={currentTheme.secondary} />
            </g>
          </svg>

          {/* PRISMATIC LIQUID HYBRID CORE */}
          <div className="relative w-44 h-44 flex items-center justify-center transition-transform duration-300">
            {/* Outer Prismatic Hexagonal Diffraction Crystals */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300"
              viewBox="0 0 160 160"
            >
              <defs>
                <linearGradient id="dynGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.primary} />
                  <stop offset="100%" stopColor={currentTheme.secondary} />
                </linearGradient>
                <linearGradient id="dynGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.secondary} />
                  <stop offset="100%" stopColor={currentTheme.primary} />
                </linearGradient>
              </defs>

              {/* Hexagonal Crystal Facets */}
              <polygon
                points="80,10 140,45 140,115 80,150 20,115 20,45"
                fill="none"
                stroke="url(#dynGrad1)"
                strokeWidth="2.5"
                strokeDasharray="10, 5"
                opacity="0.9"
              />
              <polygon
                points="80,22 130,50 130,110 80,138 30,110 30,50"
                fill="none"
                stroke="url(#dynGrad2)"
                strokeWidth="2"
                opacity="0.85"
              />

              {/* Expanding Prism Aperture Blades */}
              <g
                ref={irisBladesRef}
                className="transition-transform duration-300"
                style={{ transformOrigin: "80px 80px" }}
              >
                <path
                  d="M80,32 L115,80 L80,128 Z"
                  fill="url(#dynGrad1)"
                  fillOpacity="0.3"
                  stroke={currentTheme.primary}
                  strokeWidth="1.5"
                />
                <path
                  d="M80,32 L45,80 L80,128 Z"
                  fill="url(#dynGrad2)"
                  fillOpacity="0.3"
                  stroke={currentTheme.secondary}
                  strokeWidth="1.5"
                />
                <line
                  x1="80"
                  y1="16"
                  x2="80"
                  y2="144"
                  stroke="#ffffff"
                  strokeWidth="1"
                  opacity="0.85"
                />
                <line
                  x1="16"
                  y1="80"
                  x2="144"
                  y2="80"
                  stroke="#ffffff"
                  strokeWidth="1"
                  opacity="0.85"
                />
              </g>
            </svg>

            {/* Nested Inner Living Liquid Emotion Orb */}
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full overflow-hidden">
              <canvas
                ref={hybridOrbCanvasRef}
                width={96}
                height={96}
                className="w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* Floating Title & Subtitle */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-slate-300 text-xs font-bold uppercase tracking-wider mx-auto backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Agent Biometric Emotion Mirror</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
            REFLECTRA
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-lg font-medium leading-relaxed drop-shadow-md">
            Adaptive Multi-Agent Biometric Mirror with 2D Russell Circumplex Vector
            Modeling & Empathic Voice Reflection.
          </p>
        </div>

        {/* Diagnostic Power Surge HUD or Feature Tiles */}
        {isBooting ? (
          <div className="w-full max-w-md flex flex-col gap-2.5 font-mono text-left animate-fade-in">
            <div className="flex justify-between text-xs font-bold">
              <span
                className="flex items-center gap-2 transition-colors duration-300"
                style={{ color: currentTheme.primary }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: currentTheme.primary }}
                />
                ⚡ STAGE {currentTheme.stage}/4: {currentTheme.name}
              </span>
              <span
                className="font-extrabold transition-colors duration-300"
                style={{ color: currentTheme.primary }}
              >
                {progress}%
              </span>
            </div>

            {/* Glowing Gradient Power Surge Bar */}
            <div className="relative w-full h-3 rounded-full bg-slate-900/80 border border-white/[0.2] overflow-hidden p-0.5 shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  boxShadow: `0 0 15px ${currentTheme.primary}`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-300 italic pt-0.5 drop-shadow">
              {currentTheme.status}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col items-center text-center gap-1.5 hover:border-sky-400/40 transition shadow-lg">
              <Brain className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">5-Agent Engine</span>
              <span className="text-[10px] text-slate-400 font-mono">Vision ➔ LLM</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col items-center text-center gap-1.5 hover:border-purple-400/40 transition shadow-lg">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">DeepFace HUD</span>
              <span className="text-[10px] text-slate-400 font-mono">5 Hz Sampling</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col items-center text-center gap-1.5 hover:border-amber-400/40 transition shadow-lg">
              <Compass className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Russell Radar</span>
              <span className="text-[10px] text-slate-400 font-mono">Valence/Arousal</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col items-center text-center gap-1.5 hover:border-emerald-400/40 transition shadow-lg">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Living Orb</span>
              <span className="text-[10px] text-slate-400 font-mono">Harmonic Fluid</span>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        {!isBooting && (
          <div className="flex flex-col items-center gap-2.5 w-full max-w-md">
            <button
              onClick={triggerBoot}
              className="w-full py-4 rounded-2xl text-base font-black text-white bg-gradient-to-r from-sky-500 via-purple-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 shadow-[0_0_50px_rgba(56,189,248,0.55)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-white/[0.3] backdrop-blur-lg"
            >
              <Zap className="w-5 h-5 text-amber-300" />
              <span className="tracking-wide uppercase">INITIALIZE REFLECTRA</span>
            </button>

            <span className="text-xs font-mono text-slate-400 drop-shadow">
              PRESS{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-sky-300 font-bold">
                SPACE
              </kbd>{" "}
              OR{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-emerald-300 font-bold">
                ENTER
              </kbd>{" "}
              TO ENGAGE
            </span>
          </div>
        )}

        {/* Floating Telemetry Badges Strip */}
        <footer className="grid grid-cols-3 gap-3 w-full pt-2 text-center font-mono text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md shadow-lg">
            <span className="text-[10px] text-slate-400 block uppercase">CAPACITANCE</span>
            <span
              className="font-bold transition-colors duration-300"
              style={{ color: currentTheme.primary }}
            >
              {isBooting
                ? `${Math.floor(12000 * (progress / 100)).toLocaleString()} µF`
                : "12,000 µF"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md shadow-lg">
            <span className="text-[10px] text-slate-400 block uppercase">BUS FREQUENCY</span>
            <span
              className="font-bold transition-colors duration-300"
              style={{ color: currentTheme.secondary }}
            >
              {currentTheme.freq}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/[0.08] backdrop-blur-md shadow-lg">
            <span className="text-[10px] text-slate-400 block uppercase">STATE</span>
            <span
              className="font-bold transition-colors duration-300"
              style={{ color: currentTheme.primary }}
            >
              {currentTheme.state}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

WelcomeHero.propTypes = {
  onStart: PropTypes.func.isRequired,
};
