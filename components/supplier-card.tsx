"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";
import type { Supplier } from "@/lib/suppliers";

type SupplierCardProps = {
  supplier: Supplier;
  saved: boolean;
  selected: boolean;
  /** Set once the quote request is full, so only deselection stays open. */
  selectDisabled?: boolean;
  onToggleSave: () => void;
  onToggleSelect: () => void;
  /** Opens the contact dialog; the results list owns it so every selected
      supplier can be addressed at once. */
  onContact: () => void;
};

export function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** Category keywords bolded inside descriptions, as on the reference SRP card. */
function emphasize(text: string): React.ReactNode[] {
  return text.split(/(stampings?|services?)/i).map((part, index) =>
    /^(stampings?|services?)$/i.test(part) ? <strong key={index}>{part}</strong> : part,
  );
}

export const noop = (event: React.MouseEvent) => event.preventDefault();

/** Video or catalog thumbnail, captioned per its kind. */
export function MediaTile({ kind, label }: { kind: string; label: string }) {
  return (
    <div className="media-tile" role="img" aria-label={label}>
      {kind === "factoryTour" ? (
        <>
          <span className="corner">02:26</span>
          <l-icon name="circle-play" />
          <span className="caption">Factory Tour</span>
        </>
      ) : kind === "catalog" ? (
        <>
          <span className="corner">
            <l-icon name="tag" /> CATALOG
          </span>
          <span className="caption">View Products</span>
        </>
      ) : (
        <>
          <l-icon name="circle-play" />
          <span className="caption">Company Overview</span>
        </>
      )}
    </div>
  );
}

/**
 * Capability pills kept to a single line; pills that would wrap are hidden
 * and counted in a "+X" circle at the right. Re-measures when the resizable
 * panel changes width.
 */
export function CapabilityRow({ capabilities }: { capabilities: string[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [hiddenCount, setHiddenCount] = useState(0);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const pills = Array.from(row.children) as HTMLElement[];
      if (pills.length === 0) return;
      const firstTop = pills[0].offsetTop;
      setHiddenCount(pills.filter((pill) => pill.offsetTop > firstTop).length);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [capabilities]);

  return (
    <div className="cap-row">
      <div className="cap-row-pills" ref={rowRef}>
        {capabilities.map((capability) => (
          <span className="cap-pill" key={capability}>
            <l-icon name="check" /> {capability}
          </span>
        ))}
      </div>
      {hiddenCount > 0 && (
        <span
          className="cap-more"
          title={capabilities.slice(capabilities.length - hiddenCount).join(", ")}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

/** One supplier result, matching the reference SRP card content and UX. */
export function SupplierCard({
  supplier,
  saved,
  selected,
  selectDisabled,
  onToggleSave,
  onToggleSelect,
  onContact,
}: SupplierCardProps) {
  const [expanded, setExpanded] = useState(false);
  const clampable = supplier.description.length > 180;
  const media = supplier.media[0];

  return (
    <l-panel class="supplier-card">
      {/* Header row: identity + actions */}
      <div className="card-head flex gap-3 align-items-start">
        <div className="supplier-logo" aria-hidden="true">
          {monogram(supplier.name)}
        </div>
        <div className="card-identity flex-1">
          <div className="flex align-items-center gap-2">
            <a href="#" className="card-title" onClick={noop}>
              {supplier.name}
            </a>
            {supplier.verified && (
              <Image
                src={`${BASE_PATH}/verified-badge.png`}
                width={18}
                height={18}
                alt="Verified supplier"
                title="Verified supplier"
              />
            )}
          </div>
          <a href="#" className="card-profile-link" onClick={noop}>
            View Profile
          </a>
        </div>
        <div className="card-actions flex align-items-center gap-2 flex-shrink-0">
          <button
            kind="neutral-text"
            scale="small"
            className="card-save"
            aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save"}
            onClick={onToggleSave}
          >
            <l-icon name="bookmark" fill={saved || undefined} />{" "}
            <span className="card-action-label">{saved ? "Saved" : "Save"}</span>
          </button>
          <button
            kind="neutral-text"
            scale="small"
            className="card-select"
            aria-pressed={selected}
            aria-label={selected ? "Selected" : "Select"}
            disabled={selectDisabled}
            title={selectDisabled ? "Quote requests go to at most 5 suppliers" : undefined}
            onClick={onToggleSelect}
          >
            <l-icon name={selected ? "circle-check" : "circle-plus"} />{" "}
            <span className="card-action-label">{selected ? "Selected" : "Select"}</span>
          </button>
          <button kind="neutral" scale="small" className="card-contact" onClick={onContact}>
            <l-icon name="envelope" fill /> Contact Supplier
          </button>
          <button kind="primary" scale="small" className="card-cta" onClick={noop}>
            Visit Website <l-icon name="arrow-up-right-from-square" />
          </button>
        </div>
      </div>

      {/* Fact row — line icons, 14px */}
      <div className="supplier-facts">
        <span>
          <l-icon name="location-dot" />
          <a href="#" onClick={noop}>
            {supplier.city}, {supplier.state} {supplier.zip}
          </a>
        </span>
        {supplier.employees && (
          <span>
            <l-icon name="users" />
            {supplier.employees}
          </span>
        )}
        {supplier.revenue && (
          <span>
            <l-icon name="landmark" />
            {supplier.revenue}
          </span>
        )}
        {supplier.founded && (
          <span>
            <l-icon name="calendar" />
            {supplier.founded}
          </span>
        )}
      </div>

      {supplier.companyTypes.length > 0 && (
        <div className="flex align-items-center gap-2 font-semi">
          <l-icon name="industry" />
          {supplier.companyTypes.join(" · ")}
        </div>
      )}

      {/* Description — clamped, "more+" inline at the end of the last line */}
      <div className="desc-wrap">
        <p className={`mar-0 txt-smaller${expanded || !clampable ? "" : " clamp-2"}`}>
          {emphasize(supplier.description)}
        </p>
        {!expanded && clampable && (
          <span className="desc-more">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                setExpanded(true);
              }}
            >
              more+
            </a>
          </span>
        )}
      </div>

      {/* Capability pills — one line, overflow collapsed into a +X circle */}
      {supplier.capabilities.length > 0 && <CapabilityRow capabilities={supplier.capabilities} />}

      {/* Media */}
      {media && <MediaTile kind={media} label={`${supplier.name} media`} />}
    </l-panel>
  );
}
