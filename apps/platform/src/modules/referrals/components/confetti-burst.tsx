const COLORS = ["bg-primary", "bg-accent", "bg-sage", "bg-destructive/70"];

/** Dot angle/distance/color/delay — fixed so the burst renders identically
 * every time instead of reshuffling on each re-render. */
const DOTS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const distance = 22 + (i % 3) * 6;
  return {
    id: `dot-${i}`,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    color: COLORS[i % COLORS.length],
    delay: (i % 4) * 60,
  };
});

/** One-shot confetti burst centered on its parent — pair with `relative`. */
export default function ConfettiBurst() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {DOTS.map((dot) => {
        const style: React.CSSProperties &
          Record<"--confetti-x" | "--confetti-y", string> = {
          "--confetti-x": `${dot.x}px`,
          "--confetti-y": `${dot.y}px`,
          animationDelay: `${dot.delay}ms`,
        };
        return (
          <span
            className={`confetti-dot absolute size-1.5 rounded-full ${dot.color}`}
            key={dot.id}
            style={style}
          />
        );
      })}
    </span>
  );
}
