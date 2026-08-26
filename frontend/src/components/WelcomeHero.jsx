import React, { useEffect } from "react";
import { Sparkles, Brain, Eye, Compass, Volume2, ArrowRight, Activity, ShieldCheck } from "lucide-react";

export function WelcomeHero({ onStart }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090d18]/90 backdrop-blur-2xl overflow-y-auto">
      {/* Background Animated Gradient Flares */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-sky-500/20 blur-[140px] pointer-events-none animate-pulse-glow [animation-delay:1s]" />

      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900/85 border border-purple-500/30 p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col items-center text-center gap-8 z-10">
        
        {/* Animated Central AI Biometric Orb */}
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Outer Dashed Orbit */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-400/40 animate-spin-slow" />
          {/* Middle Ring */}
          <div className="absolute inset-2 rounded-full border border-sky-400/50 animate-spin-reverse" />
          {/* Core Pulsating Orb */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-sky-400 shadow-[0_0_40px_rgba(192,132,252,0.6)] flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Header Text */}
        <div className="flex flex-col gap-2.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-bold uppercase tracking-wider mx-auto">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Deep Learning Track • Project #51</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
            EmotionLens
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
            An Adaptive AI Emotion Mirror that observes facial expressions, models emotional trajectory, and reflects empathetic observations in real time.
          </p>
        </div>

        {/* 4 Feature Cards */}
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
            <span className="text-xs font-bold text-slate-200">Voice Synthesis</span>
            <span className="text-[10px] text-slate-400 font-mono">TTS Audio Wave</span>
          </div>
        </div>

        {/* Primary Call to Action Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 shadow-[0_0_40px_rgba(147,51,234,0.5)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 text-purple-200 group-hover:rotate-12 transition-transform" />
            <span>INITIALIZE NEURAL MIRROR</span>
            <ArrowRight className="w-5 h-5 text-sky-200 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <span className="text-xs font-mono text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-bold">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300 font-bold">ENTER</kbd> to begin
          </span>
        </div>

      </div>
    </div>
  );
}
