import React from "react";

/**
 * Mumzo wordmark — soft editorial serif wordmark with a heart accent.
 * Lightweight inline SVG so the mark scales crisply on any background.
 */
export default function MumzoLogo({
  variant = "full",      // "full" | "mark"
  color = "currentColor",
  accent = "#C85277",    // pink deep
  className = "",
  height,
}) {
  const commonProps = {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    className,
    "aria-label": "Mumzo",
    role: "img",
  };

  if (variant === "mark") {
    const size = height || 40;
    return (
      <svg {...commonProps} viewBox="0 0 64 64" width={size} height={size}>
        <rect x="4" y="4" width="56" height="56" rx="18" fill={accent} opacity="0.14" />
        <path
          d="M20 44 V26 Q20 20 26 20 T32 26 V44 M32 26 Q32 20 38 20 T44 26 V44"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M46 20 c1.6 -3 6 -3 6 1 c0 3 -3 5 -6 8 c-3 -3 -6 -5 -6 -8 c0 -4 4.4 -4 6 -1z"
          fill={accent}
        />
      </svg>
    );
  }

  const H = height || 40;
  // ViewBox chosen so mark + wordmark align on a common baseline
  return (
    <svg {...commonProps} viewBox="0 0 260 64" height={H}>
      {/* Mark */}
      <rect x="2" y="8" width="48" height="48" rx="14" fill={accent} opacity="0.14" />
      <path
        d="M14 42 V26 Q14 20 19 20 T24 26 V42 M24 26 Q24 20 29 20 T34 26 V42"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 22 c1 -2 4 -2 4 0.6 c0 2 -2 3.4 -4 5.4 c-2 -2 -4 -3.4 -4 -5.4 c0 -2.6 3 -2.6 4 0z"
        fill={accent}
      />

      {/* Wordmark: mumzo in italic serif — drawn with SVG text so no font-load flicker */}
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
      {/* Little dot accent above the second m — a cheeky feminine cue */}
      <circle cx="98" cy="18" r="2.4" fill={accent} />
    </svg>
  );
}
