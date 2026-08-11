"use client";

import { useEffect } from "react";

type DeepDrawGateProps = {
  open: boolean;
  /** Leave the sourcing agent for the standard Thomas search. */
  onConfirm: () => void;
  /** Stay on the question so the buyer can pick a different process. */
  onRevise: () => void;
};

/**
 * Confirmation shown when the buyer picks Deep Drawing on the process
 * question: that family is served by the standard Thomas search, not the
 * sourcing agent, so the buyer chooses between leaving or revising.
 */
export function DeepDrawGate({ open, onConfirm, onRevise }: DeepDrawGateProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onRevise();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onRevise]);

  if (!open) return null;

  return (
    <div className="gate-scrim" role="presentation" onClick={onRevise}>
      <div
        className="gate-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deep-draw-title"
        aria-describedby="deep-draw-sub"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="gate-close" aria-label="Close" onClick={onRevise}>
          <l-icon name="xmark" />
        </button>
        <h2 id="deep-draw-title" className="gate-title deep-draw-title mar-0">
          Deep Drawing requires our standard Thomas search.
        </h2>
        <p id="deep-draw-sub" className="gate-sub mar-0">
          Would you like to leave the sourcing agent to search for suppliers who offer Deep
          Drawing?
        </p>
        <div className="deep-draw-actions">
          <button kind="primary" onClick={onConfirm}>
            Yes &ndash; go to standard search
          </button>
          <button kind="neutral" onClick={onRevise}>
            No &ndash; I&apos;ll revise my answer
          </button>
        </div>
      </div>
    </div>
  );
}
