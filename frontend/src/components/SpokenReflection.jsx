import React from "react";
import { MessageSquare, Volume2, Sparkles } from "lucide-react";

export function SpokenReflection({
  text = "Welcome to EmotionLens. Express yourself and notice how your emotional patterns reflect in real time.",
  latency = null,
  model = "Local LLM",
  isSpeaking = false,
  onSpeakAgain,
}) {
  return (
    <div className="relative rounded-2xl p-5 bg-gradient-to-br from-purple-900/20 via-slate-900/80 to-sky-900/20 border border-purple-500/30 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col gap-3.5 overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Live Mirror Reflection</span>
        </div>

        {/* Dynamic Sinusoidal Audio Visualizer */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 h-4">
            <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isSpeaking ? "animate-sound-wave" : "h-1"}`} />
            <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isSpeaking ? "animate-sound-wave [animation-delay:0.2s]" : "h-1"}`} />
            <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isSpeaking ? "animate-sound-wave [animation-delay:0.4s]" : "h-1"}`} />
            <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isSpeaking ? "animate-sound-wave [animation-delay:0.1s]" : "h-1"}`} />
          </div>

          {onSpeakAgain && (
            <button
              onClick={onSpeakAgain}
              title="Repeat Reflection Voice"
              className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quote Display */}
      <div className="relative pl-3.5 border-l-2 border-purple-400 text-sm md:text-base font-medium italic text-slate-100 leading-relaxed">
        "{text}"
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/[0.06] pt-2 mt-1">
        <span>Model: {model}</span>
        <span>Latency: {latency ? `${Math.round(latency)}ms` : "--"}</span>
      </div>
    </div>
  );
}
