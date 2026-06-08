import type { CSSProperties } from "react";

/**
 * Render any string as snake_case monospace, with words joined by a brand-blue
 * underscore. E.g. "Command Center" → command_center, "Audit Trail" → audit_trail.
 *
 * This is the brand's default voice for UI labels — page titles, nav items,
 * status chips, button text, sidebar headings. The brand-blue underscore is
 * the brand tell.
 */
interface MonoLabelProps {
  text: string;
  style?: CSSProperties;
}

export function MonoLabel({ text, style }: MonoLabelProps) {
  const words = text.toLowerCase().trim().split(/\s+/);
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      {words.map((w, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: "var(--wordmark-accent)" }}>_</span>}
          {w}
        </span>
      ))}
    </span>
  );
}
