"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  MOCK_BUYER,
  QUOTE_EMAIL_STORAGE_KEY,
  type QuoteEmailPayload,
} from "@/components/contact-supplier-modal";

/** The payload is written once before this page opens — no updates to hear. */
const subscribeNever = () => () => {};

/** Plausible inbox for the supplier receiving the quote request. */
function supplierInbox(name: string): string {
  const domain = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "supplier";
  return `quotes@${domain}.com`;
}

/** "2026-09-15" -> "September 15, 2026" for the email body. */
function formatNeedBy(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** ISO timestamp -> "Aug 20, 2026, 5:33 PM" for the Gmail date line. */
function formatSentAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The Gmail "M" mark, so the inbox reads at a glance. */
function GmailLogo() {
  return (
    <svg className="gm-logo" viewBox="0 0 512 384" aria-hidden="true">
      <path fill="#4285f4" d="M34.9 384h81.4V186L0 98.8v250.3C0 368.4 15.6 384 34.9 384z" />
      <path
        fill="#34a853"
        d="M395.6 384H477c19.3 0 34.9-15.6 34.9-34.9V98.8L395.6 186z"
      />
      <path
        fill="#fbbc04"
        d="M395.6 69.8V186L512 98.8V87.3c0-43.2-49.3-67.8-83.8-41.9z"
      />
      <path fill="#ea4335" d="M116.3 186V69.8L256 174.5 395.6 69.8V186L256 290.7z" />
      <path
        fill="#c5221f"
        d="M0 87.3v11.5L116.3 186V69.8L83.8 45.4C49.3 19.5 0 44.1 0 87.3z"
      />
    </svg>
  );
}

const RAIL_ITEMS = ["Starred", "Snoozed", "Sent", "Drafts"] as const;

/**
 * The supplier's side of the story: a Gmail-style inbox showing the quote
 * request email exactly as they'd receive it. Reads the submission the
 * contact dialog stashed in localStorage — prototype-only, nothing is sent.
 */
export default function SupplierEmailPage() {
  // localStorage is a client-only external store; the server snapshot renders
  // nothing until hydration swaps in the real value.
  const raw = useSyncExternalStore(
    subscribeNever,
    () => localStorage.getItem(QUOTE_EMAIL_STORAGE_KEY),
    () => null,
  );
  const loaded = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const payload = useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as QuoteEmailPayload;
    } catch {
      return null;
    }
  }, [raw]);

  const inbox = payload ? supplierInbox(payload.supplierName) : "";

  return (
    <div className="gm-shell">
      <header className="gm-topbar">
        <button type="button" className="gm-iconbtn" aria-label="Main menu">
          <l-icon name="bars" aria-hidden="true" />
        </button>
        <span className="gm-brand">
          <GmailLogo />
          Gmail
        </span>
        <div className="gm-search" role="search">
          <l-icon name="magnifying-glass" aria-hidden="true" />
          Search mail
        </div>
        <div className="gm-topbar-right">
          <button type="button" className="gm-iconbtn" aria-label="Settings">
            <l-icon name="gear" aria-hidden="true" />
          </button>
          <button type="button" className="gm-iconbtn" aria-label="Google apps">
            <l-icon name="grid" aria-hidden="true" />
          </button>
          <span className="gm-account" aria-hidden="true">
            {payload ? payload.supplierName.charAt(0).toUpperCase() : "S"}
          </span>
        </div>
      </header>

      <div className="gm-main">
        <aside className="gm-rail">
          <button type="button" className="gm-compose">
            <l-icon name="pen" fill aria-hidden="true" /> Compose
          </button>
          <nav className="gm-rail-nav" aria-label="Mailboxes">
            <span className="gm-rail-item" data-active>
              <l-icon name="envelope" fill aria-hidden="true" /> Inbox
              <b className="gm-rail-count">1</b>
            </span>
            {RAIL_ITEMS.map((item) => (
              <span className="gm-rail-item" key={item}>
                <l-icon
                  name={item === "Starred" ? "star" : item === "Sent" ? "paper-plane" : item === "Drafts" ? "file-lines" : "clock"}
                  aria-hidden="true"
                />
                {item}
              </span>
            ))}
          </nav>
        </aside>

        <main className="gm-message">
          {loaded && !payload && (
            <div className="gm-empty">
              <p className="mar-0">
                No quote request yet — send one from the sourcing prototype and it lands here.
              </p>
            </div>
          )}

          {payload && (
            <>
              <div className="gm-toolbar">
                <button type="button" className="gm-iconbtn" aria-label="Back to inbox">
                  <l-icon name="arrow-left" aria-hidden="true" />
                </button>
                <button type="button" className="gm-iconbtn" aria-label="Archive">
                  <l-icon name="box-archive" aria-hidden="true" />
                </button>
                <button type="button" className="gm-iconbtn" aria-label="Delete">
                  <l-icon name="trash-can" aria-hidden="true" />
                </button>
                <button type="button" className="gm-iconbtn" aria-label="More">
                  <l-icon name="ellipsis-vertical" aria-hidden="true" />
                </button>
              </div>

              <h1 className="gm-subject">
                New quote request: {payload.projectName}
                <span className="gm-chip">Inbox</span>
              </h1>

              <div className="gm-sender">
                <span className="gm-avatar" aria-hidden="true">
                  T
                </span>
                <div className="gm-sender-meta">
                  <p className="mar-0">
                    <strong>Thomas</strong>{" "}
                    <span className="gm-address">&lt;quotes@thomasnet.com&gt;</span>
                  </p>
                  <p className="mar-0 gm-address">
                    to {inbox} · reply-to {MOCK_BUYER.email}
                  </p>
                </div>
                <div className="gm-sender-side">
                  <span>{formatSentAt(payload.sentAt)}</span>
                  <l-icon name="star" aria-hidden="true" />
                  <l-icon name="arrow-rotate-left" aria-hidden="true" />
                </div>
              </div>

              <div className="gm-body">
                <p className="mar-0">Hi {payload.supplierName} team,</p>
                <p className="mar-0">
                  <strong>{MOCK_BUYER.name}</strong> at <strong>{MOCK_BUYER.company}</strong> sent
                  you a quote request through Thomas. Here are the project details:
                </p>
                {payload.description && (
                  <blockquote className="contact-email-desc mar-0">
                    {payload.description}
                  </blockquote>
                )}
                {(payload.requirements.length > 0 || payload.quantity || payload.needBy) && (
                  <ul className="contact-email-reqs mar-0">
                    {payload.requirements.map((requirement) => (
                      <li key={requirement.label}>
                        <strong>{requirement.label}:</strong> {requirement.value}
                      </li>
                    ))}
                    {payload.quantity && (
                      <li>
                        <strong>Estimated quantity:</strong> {payload.quantity}
                      </li>
                    )}
                    {payload.needBy && (
                      <li>
                        <strong>Response needed by:</strong> {formatNeedBy(payload.needBy)}
                      </li>
                    )}
                  </ul>
                )}
                <div className="contact-email-ctas">
                  <button type="button" className="contact-email-cta-ghost">
                    Not interested
                  </button>
                  <button type="button" className="contact-email-cta-primary">
                    View contact details
                  </button>
                </div>
                <p className="contact-email-reply mar-0">
                  <l-icon name="envelope" aria-hidden="true" />
                  You can reply to this email directly — your reply goes straight to{" "}
                  {MOCK_BUYER.firstName} at {MOCK_BUYER.company}.
                </p>
                <p className="contact-email-foot mar-0">
                  Sent via Thomas on behalf of {MOCK_BUYER.company}. Most buyers expect a response
                  within 1–2 business days.
                </p>
              </div>

              <div className="gm-reply-row">
                <button type="button" className="gm-reply-btn">
                  <l-icon name="arrow-rotate-left" aria-hidden="true" /> Reply
                </button>
                <button type="button" className="gm-reply-btn">
                  <l-icon name="forward" aria-hidden="true" /> Forward
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
