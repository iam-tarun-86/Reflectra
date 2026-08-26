
import { Sparkles, Volume2 } from "lucide-react";

export function DemoDeck({ onInjectEmotion, onVoiceTest }) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Simulation Deck (Professor Demo)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Instant Triggers</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => onInjectEmotion("happy")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          😊 Happy
        </button>

        <button
          onClick={() => onInjectEmotion("sad")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          😢 Sad
        </button>

        <button
          onClick={() => onInjectEmotion("surprise")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          😲 Surprise
        </button>

        <button
          onClick={() => onInjectEmotion("angry")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          😡 Angry
        </button>

        <button
          onClick={() => onInjectEmotion("fear")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          😨 Fear
        </button>

        <button
          onClick={() => onInjectEmotion("disgust")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-lime-500/15 hover:bg-lime-500/25 border border-lime-500/30 text-lime-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          🤢 Disgust
        </button>

        <button
          onClick={() => onInjectEmotion("neutral")}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-slate-500/15 hover:bg-slate-500/25 border border-slate-500/30 text-slate-300 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          😐 Neutral
        </button>

        <button
          onClick={onVoiceTest}
          className="px-2 py-2 rounded-lg text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Speak</span>
        </button>
      </div>
    </div>
  );
}
