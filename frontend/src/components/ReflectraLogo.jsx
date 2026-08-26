import React from "react";

/**
 * REFLECTRA Custom Brand Emblem
 * An optical prismatic mirror iris with dual-spectrum affect lenses (Red/Blue)
 * and central neural reflection prism.
 */
export function ReflectraLogo({ className = "w-9 h-9", glow = true }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-500/40 via-purple-500/40 to-sky-400/40 blur-md pointer-events-none" />
      )}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]"
      >
        <defs>
          <linearGradient id="refGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="refGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <radialGradient id="refCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Outer Squircle Container Frame */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="#0c1020"
          stroke="url(#refGrad1)"
          strokeWidth="1.75"
        />

        {/* Diagonal Mirror Split Lines (Reflective Prism Facets) */}
        <path
          d="M 12 12 L 36 36"
          stroke="url(#refGrad1)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity="0.4"
        />

        {/* Dual Concentric Biometric Iris Lenses */}
        <circle
          cx="24"
          cy="24"
          r="13"
          stroke="url(#refGrad1)"
          strokeWidth="2"
          strokeDasharray="18 4"
        />
        <circle
          cx="24"
          cy="24"
          r="9"
          stroke="url(#refGrad2)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />

        {/* Intersecting Diamond Prism Mirror */}
        <polygon
          points="24,14 34,24 24,34 14,24"
          fill="none"
          stroke="url(#refGrad1)"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* Central Glowing Neural Core Node */}
        <circle cx="24" cy="24" r="4" fill="url(#refCoreGlow)" />
        <circle cx="24" cy="24" r="2" fill="#ffffff" />

        {/* 4 Precision Alignment Reticles */}
        <line x1="24" y1="5" x2="24" y2="9" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="39" x2="24" y2="43" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="24" x2="9" y2="24" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
        <line x1="39" y1="24" x2="43" y2="24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
