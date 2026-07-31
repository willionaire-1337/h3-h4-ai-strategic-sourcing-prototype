"use client";

import Image from "next/image";
import { useEffect } from "react";

type RegisterGateProps = {
  open: boolean;
  onDismiss: () => void;
};

/**
 * Registration gate over the results. It's a prototype, so every way out —
 * sign in, create an account, close — simply reveals the experience behind it.
 */
export function RegisterGate({ open, onDismiss }: RegisterGateProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="gate-scrim" role="presentation" onClick={onDismiss}>
      <div
        className="gate-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="gate-close" aria-label="Close" onClick={onDismiss}>
          <l-icon name="xmark" />
        </button>
        <div className="gate-brand">
          <Image src="/thomas-wordmark.png" width={238} height={48} alt="Thomas" priority />
          <span>For Industry.</span>
        </div>
        <h2 id="gate-title" className="gate-title mar-0">
          Register to continue
        </h2>
        <p className="gate-sub mar-0">
          In less than a minute you&apos;ll have access to 500k+ Suppliers
        </p>
        <button kind="primary" className="gate-cta" onClick={onDismiss}>
          Continue to Sign In <l-icon name="arrow-right-to-bracket" />
        </button>
        <p className="gate-foot mar-0">
          New to Thomas?{" "}
          <button type="button" className="gate-link" onClick={onDismiss}>
            Create Your Free Account
          </button>
        </p>
      </div>
    </div>
  );
}
