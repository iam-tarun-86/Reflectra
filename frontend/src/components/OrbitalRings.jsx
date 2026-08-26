import React from "react";

export function OrbitalRings({ moodColor = "#c084fc" }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-30">
      {/* Outer Dashed Orbital Ring */}
      <div className="absolute w-[800px] h-[800px] rounded-full border border-dashed border-white/10 animate-spin-slow" />
      
      {/* Middle Segmented Ring */}
      <div className="absolute w-[560px] h-[560px] rounded-full border border-white/15 border-t-cyan-400/40 border-b-purple-500/40 animate-spin-reverse" />
      
      {/* Inner Glowing Core */}
      <div
        className="absolute w-[320px] h-[320px] rounded-full blur-2xl opacity-20 transition-colors duration-700"
        style={{ backgroundColor: moodColor }}
      />
      <div className="absolute w-[320px] h-[320px] rounded-full border border-white/10" />
    </div>
  );
}
