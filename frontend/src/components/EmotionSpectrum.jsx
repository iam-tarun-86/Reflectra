
import { BarChart2, Clock } from "lucide-react";

const EMOTIONS = [
  { key: "happy", label: "Happy", color: "#10b981" },
  { key: "sad", label: "Sad", color: "#3b82f6" },
  { key: "surprise", label: "Surprise", color: "#f59e0b" },
  { key: "neutral", label: "Neutral", color: "#64748b" },
  { key: "angry", label: "Angry", color: "#ef4444" },
  { key: "fear", label: "Fear", color: "#a855f7" },
  { key: "disgust", label: "Disgust", color: "#84cc16" },
];

export function EmotionSpectrum({
  rawScores = {},
  dominantMood = "neutral",
  trend = "stable",
  duration = 0,
  stability = 0,
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Dominant Mood Hero Box */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Active Mood State
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-white/[0.08] text-slate-300 font-mono">
            {trend}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-3.5 py-1 rounded-lg text-sm font-extrabold capitalize text-white shadow-lg"
              style={{
                backgroundColor: `${EMOTIONS.find((e) => e.key === dominantMood)?.color || "#64748b"}25`,
                borderColor: `${EMOTIONS.find((e) => e.key === dominantMood)?.color || "#64748b"}50`,
                borderWidth: "1px",
                color: EMOTIONS.find((e) => e.key === dominantMood)?.color || "#ffffff",
              }}
            >
              {dominantMood}
            </span>
          </div>

          <div className="text-right font-mono text-xs text-slate-300">
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{duration.toFixed(1)}s</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Stability: <b className="text-emerald-400">{Math.round(stability * 100)}%</b>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Emotion Probability Breakdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Probability Spectrum</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">7 Dimensions</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {EMOTIONS.map(({ key, label, color }) => {
            const val = rawScores[key] || 0.0;
            const pct = Math.round(val * 100);
            return (
              <div key={key} className="grid grid-cols-[70px_1fr_40px] items-center gap-2 text-xs">
                <span className="font-semibold text-slate-300 capitalize text-[11px]">{label}</span>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}88`,
                    }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-400 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
