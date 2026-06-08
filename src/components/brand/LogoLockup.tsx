import type { CSSProperties } from "react";
import { Wordmark } from "./Wordmark";

/**
 * Brand lockup — 4-quadrant logomark + monospace wordmark.
 *
 * The logomark contains all four brand colors (amber / cyan / mulberry / blue),
 * once, quietly. The wordmark is ink + a brand-blue underscore. Together they're
 * the canonical brand mark across light and dark surfaces.
 */

interface LogoLockupProps {
  /** Height of the lockup. Default 36px. */
  size?: number;
  /** "light" for default cream surfaces, "dark" for dark headers. */
  variant?: "light" | "dark";
  /** Show only the logomark (no wordmark text). */
  markOnly?: boolean;
  /** Wordmark text. Defaults to "website support studio". */
  text?: string;
  style?: CSSProperties;
}

export function LogoLockup({
  size = 36,
  variant = "light",
  markOnly = false,
  text = "website support studio",
  style,
}: LogoLockupProps) {
  const cellGap = size * 0.05;
  const cell = (size - cellGap) / 2;
  const radius = size * 0.07;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.35,
        ...style,
      }}
    >
      {/* Logomark — inline SVG scales with `size` */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={markOnly ? "Website Support Studio" : undefined}
        aria-hidden={markOnly ? undefined : true}
        style={{ flexShrink: 0 }}
      >
        <rect x={0} y={0} width={cell} height={cell} rx={radius} fill="var(--brand-amber)" />
        <rect x={cell + cellGap} y={0} width={cell} height={cell} rx={radius} fill="var(--brand-cyan)" />
        <rect x={0} y={cell + cellGap} width={cell} height={cell} rx={radius} fill="var(--brand-mulberry)" />
        <rect x={cell + cellGap} y={cell + cellGap} width={cell} height={cell} rx={radius} fill="var(--brand-blue)" />
      </svg>

      {!markOnly && (
        <Wordmark
          text={text}
          fontSize={`${size * 0.55}px`}
          style={
            variant === "dark"
              ? {
                  color: "var(--wordmark-ink-inverse)",
                  ["--wordmark-ink" as string]: "var(--wordmark-ink-inverse)",
                  ["--wordmark-accent" as string]: "var(--wordmark-accent-inverse)",
                }
              : undefined
          }
        />
      )}
    </span>
  );
}
