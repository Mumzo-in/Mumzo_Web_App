/**
 * MumzoLogo — inline SVG wordmark + mark component.
 * No image load required — scales crisply on any background.
 *
 * Props:
 *   variant  "full" (default) | "mark"   — full lockup or icon-only
 *   color    SVG stroke/fill color        — defaults to currentColor
 *   accent   Heart & dot accent color    — defaults to #1F1B3A (ink navy)
 *   height   Number, rendered height in px
 *   className Optional extra classes
 */

interface MumzoLogoProps {
  variant?: "full" | "mark";
  color?: string;
  accent?: string;
  height?: number;
  className?: string;
}

export default function MumzoLogo({
  variant = "full",
  color = "currentColor",
  accent = "#1F1B3A",
  className = "",
  height,
}: MumzoLogoProps) {
  const commonProps = {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    className,
    "aria-label": "Mumzo",
    role: "img" as const,
  };

  // Mark-only variant — for avatars, app icons, favicons
  if (variant === "mark") {
    const size = height || 40;
    return (
      <svg {...commonProps} viewBox="0 0 64 64" width={size} height={size}>
        <title>Mumzo logo</title>
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="18"
          fill={accent}
          opacity="0.14"
        />
        <path
          d="M20 44 V26 Q20 20 26 20 T32 26 V44 M32 26 Q32 20 38 20 T44 26 V44"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Heart accent — top-right of the mark */}
        <path
          d="M46 20 c1.6 -3 6 -3 6 1 c0 3 -3 5 -6 8 c-3 -3 -6 -5 -6 -8 c0 -4 4.4 -4 6 -1z"
          fill={accent}
        />
      </svg>
    );
  }

  // Full wordmark — mark + "mumzo" italic serif text
  const H = height || 40;
  return (
    <svg {...commonProps} viewBox="0 0 260 64" height={H}>
      <title>Mumzo Mark</title>

      {/* Mark */}
      <rect
        x="2"
        y="8"
        width="48"
        height="48"
        rx="14"
        fill={accent}
        opacity="0.14"
      />
      <path
        d="M14 42 V26 Q14 20 19 20 T24 26 V42 M24 26 Q24 20 29 20 T34 26 V42"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Heart accent */}
      <path
        d="M38 22 c1 -2 4 -2 4 0.6 c0 2 -2 3.4 -4 5.4 c-2 -2 -4 -3.4 -4 -5.4 c0 -2.6 3 -2.6 4 0z"
        fill={accent}
      />

      {/* Wordmark — Fraunces italic, drawn as SVG text so there's no font-load flicker */}
      <text
        x="62"
        y="44"
        fontFamily="Fraunces, ui-serif, Georgia, serif"
        fontSize="34"
        fontStyle="italic"
        fontWeight="500"
        letterSpacing="-0.5"
        fill={color}
      >
        mumzo
      </text>
      {/* Cheeky dot accent above the second m */}
      <circle cx="98" cy="18" r="2.4" fill={accent} />
    </svg>
  );
}
