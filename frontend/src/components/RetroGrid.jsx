

export function RetroGrid({ moodGlowColor = "rgba(100, 116, 139, 0.2)" }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Radial Mood Ambient Aura */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-40 transition-colors duration-1000"
        style={{ background: moodGlowColor }}
      />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 bg-purple-600/30" />

      {/* Cyber Isometric Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 60%, transparent 100%)",
        }}
      />
    </div>
  );
}
