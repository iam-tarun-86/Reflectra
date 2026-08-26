
import { Volume2, Sparkles } from "lucide-react";
import { LivingEmotionOrb } from "./LivingEmotionOrb";

export function SpokenReflection({
  text = "Welcome to REFLECTRA. Express yourself and notice how your emotional patterns reflect in real time.",
  latency = null,
  model = "Local LLM",
  isSpeaking = false,
  dominantMood = "neutral",
  valence = 0,
  arousal = 0.5,
  stability = 0.8,
  onSpeakAgain,
}) {
  return (
    <div className="relative rounded-2xl p-5 bg-gradient-to-br from-purple-900/25 via-slate-900/85 to-sky-900/25 border border-purple-500/35 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.55)] flex flex-col gap-3.5 overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Empathic Mirror Reflection</span>
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
              className="p-1 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Living Empathic Emotion Orb */}
      <div className="my-[-8px]">
        <LivingEmotionOrb
          dominantMood={dominantMood}
          valence={valence}
          arousal={arousal}
          stability={stability}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Quote Display */}
      <div className="relative pl-3.5 border-l-2 border-purple-400 text-sm md:text-base font-medium italic text-slate-100 leading-relaxed bg-slate-950/40 p-3 rounded-r-xl border border-white/[0.04]">
        &ldquo;{text}&rdquo;
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/[0.06] pt-2 mt-0.5">
        <span>Model: {model}</span>
        <span>Latency: {latency ? `${Math.round(latency)}ms` : "--"}</span>
      </div>
    </div>
  );
}
