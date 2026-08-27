"use client";

import Image from "next/image";
import { useState } from "react";
import { BASE_PATH } from "@/lib/base-path";

const noop = (event: React.MouseEvent) => event.preventDefault();

type SiteNavbarProps = {
  query: string;
  onSearch: (text: string) => void;
};

/** Top navigation and category search bar, after the Thomas SRP header. */
export function SiteNavbar({ query, onSearch }: SiteNavbarProps) {
  const [draft, setDraft] = useState(query);
  // Sync the input when the active search changes (adjust-state-during-render).
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setDraft(query);
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (text) onSearch(text);
  };

  return (
    <header className="site-nav">
      <nav className="site-nav-row">
        <a href="#" className="site-logo" onClick={noop} aria-label="Thomas">
          <Image
            src={`${BASE_PATH}/thomas-wordmark.png`}
            width={119}
            height={24}
            alt="Thomas"
            priority
          />
        </a>
        <div className="site-nav-links">
          <a href="#" onClick={noop}>
            Find Suppliers <l-icon name="angle-down" />
          </a>
          <a href="#" onClick={noop}>
            Grow Your Business <l-icon name="angle-down" />
          </a>
          <a href="#" onClick={noop}>
            Industry Insights <l-icon name="angle-down" />
          </a>
        </div>
        <div className="site-nav-links site-nav-right">
          <a href="#" onClick={noop}>
            Advertise
          </a>
          <a href="#" onClick={noop}>
            Claim Your Company
          </a>
          <a href="#" onClick={noop}>
            <l-icon name="circle-user" /> Account <l-icon name="angle-down" />
          </a>
        </div>
      </nav>
      <form className="site-search" onSubmit={submit}>
        <input
          type="text"
          value={draft}
          aria-label="Search suppliers"
          placeholder="Search stamping services…"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="site-search-btn" aria-label="Search">
          <l-icon name="magnifying-glass" />
        </button>
      </form>
    </header>
  );
}
