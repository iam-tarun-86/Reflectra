import React from "react";
import { Eye, Activity, Brain, ShieldAlert, MessageSquare } from "lucide-react";

export function NeuralPipeline({
  isVisionActive = true,
  stateStability = 0,
  contextSessionSec = 0,
  governorStatus = "IDLE", // 'IDLE' | 'TRIGGER' | 'COOLDOWN'
  llmLatency = null,
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Brain className="w-4 h-4 text-purple-400" />
          <span>Multi-Agent Neural Pipeline (Live Stream)</span>
        </div>
        <span className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-400/20">
          5 Agents Active
        </span>
      </div>

      {/* 5-Node Flow Grid */}
      <div className="grid grid-cols-5 gap-1.5 items-center p-2 rounded-xl bg-slate-950/70 border border-white/[0.06] overflow-x-auto">
        
        {/* Node 1: Vision */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/80 border border-white/[0.08] text-center relative group">
          <Eye className="w-4 h-4 text-sky-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-300">Vision</span>
          <span className="text-[9px] font-mono text-emerald-400 mt-0.5 font-semibold">
            {isVisionActive ? "5.0 Hz" : "Waiting"}
          </span>
          <span className="text-[8px] text-slate-400 block font-mono">DeepFace</span>
        </div>

        {/* Node 2: State */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/80 border border-white/[0.08] text-center relative group">
          <Activity className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-300">State</span>
          <span className="text-[9px] font-mono text-emerald-400 mt-0.5 font-semibold">
            {Math.round(stateStability * 100)}%
          </span>
          <span className="text-[8px] text-slate-400 block font-mono">Window 15</span>
        </div>

        {/* Node 3: Context */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/80 border border-white/[0.08] text-center relative group">
          <Brain className="w-4 h-4 text-indigo-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-300">Context</span>
          <span className="text-[9px] font-mono text-sky-400 mt-0.5 font-semibold">
            {Math.round(contextSessionSec)}s
          </span>
          <span className="text-[8px] text-slate-400 block font-mono">Memory</span>
        </div>

        {/* Node 4: Governor */}
        <div
          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all duration-300 ${
            governorStatus === "TRIGGER"
              ? "bg-purple-500/20 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)]"
              : governorStatus === "COOLDOWN"
              ? "bg-amber-500/10 border-amber-400/40 text-amber-300"
              : "bg-slate-900/80 border-white/[0.08]"
          }`}
        >
          <ShieldAlert
            className={`w-4 h-4 mb-1 ${
              governorStatus === "TRIGGER"
                ? "text-purple-300 animate-bounce"
                : governorStatus === "COOLDOWN"
                ? "text-amber-400"
                : "text-slate-400"
            }`}
          />
          <span className="text-[10px] font-bold text-slate-300">Governor</span>
          <span
            className={`text-[9px] font-mono mt-0.5 font-extrabold ${
              governorStatus === "TRIGGER"
                ? "text-purple-300"
                : governorStatus === "COOLDOWN"
                ? "text-amber-400"
                : "text-slate-400"
            }`}
          >
            {governorStatus}
          </span>
          <span className="text-[8px] text-slate-400 block font-mono">Rule Gate</span>
        </div>

        {/* Node 5: LLM */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/80 border border-white/[0.08] text-center relative group">
          <MessageSquare className="w-4 h-4 text-purple-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-300">LLM</span>
          <span className="text-[9px] font-mono text-purple-300 mt-0.5 font-semibold">
            {llmLatency ? `${Math.round(llmLatency)}ms` : "Ready"}
          </span>
          <span className="text-[8px] text-slate-400 block font-mono">Local LLM</span>
        </div>

      </div>
    </div>
  );
}
