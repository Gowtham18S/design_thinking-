import React from 'react';

export const GlobalNetworkBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#050814] select-none">
      {/* Deep Navy / Midnight Blue Background Gradients */}
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] rounded-full bg-gradient-to-b from-blue-900/20 via-indigo-950/25 to-transparent blur-3xl" />
      <div className="absolute top-1/3 -left-48 w-[600px] h-[600px] rounded-full bg-cyan-900/15 blur-3xl" />
      <div className="absolute top-1/2 -right-48 w-[700px] h-[700px] rounded-full bg-violet-950/20 blur-3xl" />
      <div className="absolute -bottom-48 left-1/3 w-[800px] h-[500px] rounded-full bg-amber-950/10 blur-3xl" />

      {/* Subtle Digital World Light Grid & Connecting Arcs */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="travelGrid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(148, 163, 184, 0.22)" strokeWidth="0.75" />
            <circle cx="0" cy="0" r="1.5" fill="rgba(56, 189, 248, 0.4)" />
          </pattern>
          <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#travelGrid)" />

        {/* Curved flight paths & light trails */}
        <g stroke="url(#arcGlow)" fill="none" strokeWidth="1.2" strokeDasharray="6 6" opacity="0.6">
          <path d="M -100 250 Q 300 80 700 200 T 1400 120" />
          <path d="M 100 600 Q 500 400 900 550 T 1600 480" />
          <path d="M 200 100 Q 600 350 1100 220" />
        </g>
      </svg>

      {/* Gentle Vignette Mask */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#050814]/30 to-[#050814]/95 pointer-events-none" />
    </div>
  );
};
