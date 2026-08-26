import { useRef, useEffect } from "react";
import { Terminal, Trash2 } from "lucide-react";

export function TelemetryConsole({ logs = [], onClear }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Live Neural Telemetry Console</span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            title="Clear Console"
            className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="h-28 overflow-y-auto p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.06] font-mono text-[11px] flex flex-col gap-1 text-slate-300"
      >
        {logs.length === 0 ? (
          <span className="text-slate-400 italic">Telemetry stream initialized. Awaiting events...</span>
        ) : (
          logs.map((item, idx) => (
            <div key={idx} className="leading-tight">
              <span className="text-slate-400">[{item.time}s]</span>{" "}
              <span
                className={`font-bold ${
                  item.agent === "Vision"
                    ? "text-sky-400"
                    : item.agent === "State"
                    ? "text-emerald-400"
                    : item.agent === "Governor"
                    ? "text-amber-400"
                    : item.agent === "LLM"
                    ? "text-purple-400"
                    : "text-slate-400"
                }`}
              >
                [{item.agent}]
              </span>{" "}
              <span>{item.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
