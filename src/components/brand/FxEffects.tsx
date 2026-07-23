export function ParticleField({ count = 22 }: { count?: number }) {
  const particles = Array.from({ length: count });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const size = 2 + Math.random() * 4;
        const tx = (Math.random() - 0.5) * 400;
        const ty = -200 - Math.random() * 300;
        const delay = Math.random() * 4;
        const dur = 4 + Math.random() * 6;
        return (
          <span
            key={i}
            className="absolute rounded-full bg-gold/70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              width: size,
              height: size,
              // @ts-expect-error css vars
              "--tx": `${tx}px`,
              "--ty": `${ty}px`,
              animation: `particle-drift ${dur}s ease-in ${delay}s infinite`,
              boxShadow: "0 0 10px rgba(212,162,76,0.7)",
            }}
          />
        );
      })}
    </div>
  );
}

export function NetworkGrid() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
      viewBox="0 0 400 600"
      fill="none"
    >
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(212,162,76,0.6)" />
          <stop offset="100%" stopColor="rgba(212,162,76,0)" />
        </radialGradient>
      </defs>
      {[...Array(10)].map((_, i) => (
        <circle key={i} cx={200} cy={300} r={40 + i * 26} stroke="url(#rg)" strokeWidth="0.6" />
      ))}
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x = 200 + Math.cos(a) * 180;
        const y = 300 + Math.sin(a) * 180;
        return (
          <line
            key={i}
            x1={200}
            y1={300}
            x2={x}
            y2={y}
            stroke="rgba(212,162,76,0.3)"
            strokeWidth="0.4"
            className="animate-chain-flow"
          />
        );
      })}
    </svg>
  );
}
