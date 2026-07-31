import type { CSSProperties } from "react";

type ThinkingState = "idle" | "thinking" | "done" | "error";

type ThinkingIndicatorProps = {
  state?: ThinkingState;
  /** Mark height in px. Defaults to the 26px inline chat size. */
  size?: number;
  label?: string;
};

/**
 * The Thomas mark as a working indicator: three blocks sweep out of the glyph
 * one at a time while the assistant is thinking, and the mark pops back to
 * rest when it lands. Motion lives in `.th-think` in globals.css.
 */
export function ThinkingIndicator({
  state = "thinking",
  size,
  label = "Assistant is working",
}: ThinkingIndicatorProps) {
  const thinking = state === "thinking";
  return (
    <span
      className="th-think"
      data-state={state}
      style={size ? ({ "--th-size": `${size}px` } as CSSProperties) : undefined}
      role={thinking ? "progressbar" : undefined}
      aria-label={thinking ? label : undefined}
    >
      <svg viewBox="0 0 64 104" aria-hidden="true">
        <rect className="th-cap" x="0" y="0" width="64" height="22" />
        <rect className="th-leg" x="0" y="41" width="24" height="63" />
        <rect className="th-leg" x="41" y="41" width="23" height="63" />
        <rect className="th-block th-block-cap th-b1" x="0" y="0" width="24" height="22" />
        <rect className="th-block th-block-leg th-b2" x="0" y="41" width="24" height="20" />
        <rect className="th-block th-block-leg th-b3" x="41" y="41" width="23" height="20" />
      </svg>
    </span>
  );
}
