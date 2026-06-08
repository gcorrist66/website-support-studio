import type { CSSProperties } from "react";

/**
 * Website Support Studio wordmark — monospace ink letters separated by a
 * brand-blue underscore. Same brand system as Corriston Consulting (the
 * parent firm); palette defined as the HSL complements of Google's brand
 * colors. See chatgpt-handoff-prompt-v2.md for the full spec.
 */

interface WordmarkProps {
  fontSize?: string;
  style?: CSSProperties;
  /** Override the wordmark text. Defaults to "website support studio". */
  text?: string;
}

export function Wordmark({
  fontSize = "1rem",
  style,
  text = "website support studio",
}: WordmarkProps) {
  const words = text.split(" ");
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 800,
        letterSpacing: "-0.025em",
        lineHeight: 1,
        fontSize,
        whiteSpace: "nowrap",
        color: "var(--wordmark-ink)",
        ...style,
      }}
    >
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: "var(--wordmark-accent)" }}>_</span>}
          {word}
        </span>
      ))}
    </span>
  );
}
