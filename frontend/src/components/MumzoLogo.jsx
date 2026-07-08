/**
 * Mumzo Logo — custom editorial SVG mark.
 * The squircle "m" mark has two soft humps that echo a baby's silhouette,
 * a small dot for the child, paired with a Fraunces italic wordmark.
 */
export default function MumzoLogo({
  size = 40,
  color = "#1F1B3A",
  showWordmark = true,
  variant = "light", // "light" | "dark"
  className = "",
  "data-testid": testId,
}) {
  const inkColor = variant === "dark" ? "#FDFBF7" : color;
  const bgAccent = variant === "dark" ? "#FDE2CE" : "#FDE2CE"; // peach halo

  return (
    <span
      data-testid={testId || "mumzo-logo"}
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="Mumzo"
    >
      {/* Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
        style={{ display: "block", flex: "0 0 auto" }}
      >
        {/* Warm peach halo */}
        <path
          d="M32 3 C 50 3 61 14 61 32 C 61 50 50 61 32 61 C 14 61 3 50 3 32 C 3 14 14 3 32 3 Z"
          fill={bgAccent}
          opacity="0.55"
        />
        {/* Squircle ink border */}
        <path
          d="M32 5 C 48.5 5 59 15.5 59 32 C 59 48.5 48.5 59 32 59 C 15.5 59 5 48.5 5 32 C 5 15.5 15.5 5 32 5 Z"
          fill="none"
          stroke={inkColor}
          strokeWidth="2.4"
        />
        {/* Stylised 'm' — two arches echo a baby silhouette */}
        <path
          d="M15 46 L15 30 C 15 22 20 18 25.5 18 C 29.5 18 32 20 32 24 L32 46 M32 26 C 32 21 34.5 18 39 18 C 44.5 18 49 22 49 30 L49 46"
          stroke={inkColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Baby dot — the child */}
        <circle cx="32" cy="14" r="2.4" fill={inkColor} />
      </svg>

      {showWordmark && (
        <span
          className="font-editorial"
          style={{
            color: inkColor,
            fontSize: `${Math.round(size * 0.72)}px`,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            fontStyle: "normal",
          }}
        >
          mumzo
          <span
            style={{
              display: "inline-block",
              marginLeft: 2,
              width: `${Math.max(4, Math.round(size * 0.09))}px`,
              height: `${Math.max(4, Math.round(size * 0.09))}px`,
              borderRadius: 9999,
              background: "#F59E7B",
              verticalAlign: "baseline",
              transform: "translateY(-2px)",
            }}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
