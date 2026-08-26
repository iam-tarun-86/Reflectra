import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Brain, Eye, Compass, Volume2, Zap, ShieldCheck, Activity, Cpu, ArrowRight } from "lucide-react";
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

  const triggerBoot = () => {
    if (isBooting) return;
    soundFX.playClick();
    setIsBooting(true);
  };

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
    }, 45); // ~2.3 seconds total boot sequence

    return () => clearInterval(interval);
  }, [isBooting, onStart]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        triggerBoot();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBooting]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090d18]/92 backdrop-blur-2xl overflow-y-auto">
      {/* Dynamic Ambient Energy Aura */}
      <div className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/25 blur-[160px] pointer-events-none transition-all duration-700 ${isBooting ? "scale-150 opacity-60" : "animate-pulse-glow"}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-sky-500/25 blur-[160px] pointer-events-none transition-all duration-700 ${isBooting ? "scale-150 opacity-60" : "animate-pulse-glow"}`} />

      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900/90 border border-purple-500/30 p-8 md:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.85)] flex flex-col items-center text-center gap-8 z-10">
        
        {/* Animated Central AI Biometric Orb / Power Core */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Outer Dashed Orbit */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed border-purple-400/40 ${
              isBooting ? "animate-spin [animation-duration:1.2s] border-sky-400" : "animate-spin-slow"
            }`}
          />
          {/* Middle Segmented Ring */}
          <div
            className={`absolute inset-3 rounded-full border-2 border-sky-400/40 ${
              isBooting ? "animate-spin-reverse [animation-duration:0.8s] border-purple-400" : "animate-spin-reverse"
            }`}
          />
          {/* Inner Energy Core */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_0_50px_rgba(192,132,252,0.6)] ${
              isBooting
                ? "bg-gradient-to-tr from-purple-500 via-sky-400 to-emerald-400 scale-110 shadow-[0_0_70px_#38bdf8]"
                : "bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 animate-pulse"
            }`}
          >
            {isBooting ? (
              <span className="font-mono text-lg font-black text-slate-950 tracking-tighter">
                {progress}%
              </span>
            ) : (
              <Sparkles className="w-9 h-9 text-white" />
            )}
          </div>
        </div>

        {/* Header Branding */}
        <div className="flex flex-col gap-2.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider mx-auto">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Deep Learning Track • Project #51</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
            EmotionLens
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
            Adaptive Multi-Agent Emotion Mirror with real-time biometric vision, 2D Russell Circumplex vector modeling, and empathic voice reflection.
          </p>
        </div>

        {/* Bootloader Diagnostic Terminal / 4 Feature Badges */}
        {isBooting ? (
          <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30 flex flex-col gap-3 font-mono text-left animate-fade-in shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                SYSTEM BOOTLOADER IN PROGRESS
              </span>
              <span className="text-emerald-400 font-bold">{progress}% READY</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-sky-400 to-emerald-400 transition-all duration-75 shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-slate-300 italic pt-1">{currentStatus}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-purple-400/40 transition">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">5-Agent Engine</span>
              <span className="text-[10px] text-slate-400 font-mono">Vision ➔ LLM</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-sky-400/40 transition">
              <Eye className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">DeepFace HUD</span>
              <span className="text-[10px] text-slate-400 font-mono">5 Hz Sampling</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-emerald-400/40 transition">
              <Compass className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Russell Radar</span>
              <span className="text-[10px] text-slate-400 font-mono">Valence vs Arousal</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/[0.1] flex flex-col items-center text-center gap-1.5 hover:border-amber-400/40 transition">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Living Orb & Voice</span>
              <span className="text-[10px] text-slate-400 font-mono">Hume AI Style</span>
            </div>
          </div>
        )}

        {/* Primary Call to Action Button */}
        {!isBooting && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={triggerBoot}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 shadow-[0_0_40px_rgba(147,51,234,0.5)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>ENGAGE NEURAL CORE</span>
              <ArrowRight className="w-5 h-5 text-sky-200 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <span className="text-xs font-mono text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-bold">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-bold">ENTER</kbd> to initiate bootloader
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
