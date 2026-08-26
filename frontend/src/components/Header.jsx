
import { Volume2, VolumeX, BarChart3, Activity, Cpu, Pause } from "lucide-react";
import { ReflectraLogo } from "./ReflectraLogo";

export function Header({
  isConnected,
  fps,
  isVoiceEnabled,
  onToggleVoice,
  onOpenSummary,
  onStandby,
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-slate-900/85 backdrop-blur-xl border-b border-white/[0.12]">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3.5">
        <ReflectraLogo className="w-10 h-10" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-purple-200 to-sky-400 bg-clip-text text-transparent">
              REFLECTRA
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-200">
              Deep Learning Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            Adaptive AI Emotion Mirror • Multi-Agent Deep Learning Architecture
          </p>
        </div>
      </div>

      {/* Real-time Telemetry Status Pills */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-white/[0.12] text-xs font-medium text-slate-200">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"
                : "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
            }`}
          />
          <span>{isConnected ? "Neural Stream Online" : "Connecting..."}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-white/[0.12] text-xs font-mono text-slate-200">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>FPS: {fps}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-white/[0.12] text-xs font-mono text-slate-200">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>DeepFace 5Hz</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {onStandby && (
          <button
            onClick={onStandby}
            title="Return to Standby"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.12] text-slate-300 transition cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Standby</span>
          </button>
        )}

        <button
          onClick={onToggleVoice}
          title="Toggle Voice Mode (V)"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border cursor-pointer ${
            isVoiceEnabled
              ? "bg-sky-500/20 border-sky-400/40 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
              : "bg-slate-800/80 border-white/[0.12] text-slate-400 hover:text-slate-200"
          }`}
        >
          {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          <span>{isVoiceEnabled ? "Voice: ON" : "Voice: OFF"}</span>
        </button>

        <button
          onClick={onOpenSummary}
          title="End Session & Analytics (E)"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-purple-600 to-sky-500 hover:from-rose-500 hover:to-sky-400 shadow-[0_4px_18px_rgba(244,63,94,0.4)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span>End Session</span>
        </button>
      </div>
    </header>
  );
}
