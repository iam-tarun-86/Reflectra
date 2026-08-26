import React, { useState, useEffect, useRef } from "react";
import { X, Download, BarChart2, Sparkles } from "lucide-react";

export function AnalyticsModal({
  isOpen,
  onClose,
  sessionDuration = 0,
  totalReactions = 0,
  dominantMood = "neutral",
  shiftHistory = [],
  timelineData = [],
  lastReflection = "",
  onSpeak,
}) {
  const [closingObservation, setClosingObservation] = useState("Analyzing session patterns with local LLM...");
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;
    setClosingObservation("Synthesizing session reflection with local LLM...");

    async function fetchSummary() {
      try {
        const counts = {};
        timelineData.forEach((p) => {
          counts[p.emotion] = (counts[p.emotion] || 0) + 1;
        });
        const dominantEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        const domStr = dominantEntry
          ? `${dominantEntry[0]} (${Math.round((dominantEntry[1] / (timelineData.length || 1)) * 100)}%)`
          : "Neutral (100%)";

        const res = await fetch("/session/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dominant: domStr,
            shifts: shiftHistory.slice(-6),
            points: timelineData.length,
            last_mood: dominantMood,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const text = data.text || "A session of mindful expressions and steady presence.";
            setClosingObservation(text);
            if (onSpeak) onSpeak(text);
          }
        } else {
          if (isMounted) {
            setClosingObservation("A serene and observant session — thank you for exploring REFLECTRA.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setClosingObservation(
            lastReflection && !lastReflection.includes("Welcome")
              ? lastReflection
              : "A serene and observant session — thank you for exploring REFLECTRA."
          );
        }
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            project: "REFLECTRA (Adaptive Biometric Mirror)",
            timestamp: new Date().toISOString(),
            sessionDurationSec: Math.round(sessionDuration),
            dominantMood,
            totalReactions,
            shifts: shiftHistory,
            timelinePoints: timelineData,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `reflectra_analytics_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0c0f1a] border border-rose-500/30 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col gap-4 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-extrabold text-white">
            <BarChart2 className="w-5 h-5 text-rose-400" />
            <span>Session Biometric Analytics</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-center">
            <span className="text-xl font-extrabold text-rose-400">{Math.round(sessionDuration)}s</span>
            <span className="text-[10px] text-slate-400 block uppercase mt-0.5">Duration</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-center">
            <span className="text-xl font-extrabold text-emerald-400 capitalize">{dominantMood}</span>
            <span className="text-[10px] text-slate-400 block uppercase mt-0.5">Dominant</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-center">
            <span className="text-xl font-extrabold text-sky-400">{totalReactions}</span>
            <span className="text-[10px] text-slate-400 block uppercase mt-0.5">Reflections</span>
          </div>
        </div>

        {/* Emotional Shifts Log */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Emotional Transitions History
          </span>
          <div className="h-24 overflow-y-auto p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] text-xs font-mono text-slate-300 flex flex-col gap-1">
            {shiftHistory.length === 0 ? (
              <span className="text-slate-400 italic">Stable emotional expression throughout the session.</span>
            ) : (
              shiftHistory.map((s, i) => (
                <div key={i}>
                  • <span className="text-slate-400">{s.time}s:</span>{" "}
                  <span className="font-bold text-slate-200">{s.from.toUpperCase()}</span> ➔{" "}
                  <span className="font-bold text-rose-300">{s.to.toUpperCase()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Closing Observation */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/30 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Mirror Closing Observation</span>
          </div>
          <p className="text-sm italic text-slate-200 leading-relaxed">
            &ldquo;{closingObservation}&rdquo;
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-purple-600 to-sky-500 hover:from-rose-500 hover:to-sky-400 shadow-md transition cursor-pointer"
          >
            Resume Mirror
          </button>
        </div>

      </div>
    </div>
  );
}
