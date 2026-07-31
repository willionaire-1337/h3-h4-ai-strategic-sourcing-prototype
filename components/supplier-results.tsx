"use client";

import { useMemo, useState } from "react";
import { FilterDrawer, type FilterGroup } from "@/components/filter-drawer";
import { SupplierCard } from "@/components/supplier-card";
import { questionById, candidatesFor, type LoggedAnswer } from "@/lib/simulation";
import { planScreening, scoreRecord } from "@/lib/screening";
import {
  CATEGORY_LABEL,
  CATEGORY_SUPPLIER_COUNT,
  scaleToCategory,
  type Supplier,
} from "@/lib/suppliers";

const PAGE_SIZE = 25;
/** Suppliers one quote request can go out to. */
const SELECTION_LIMIT = 5;

type SupplierResultsProps = {
  answers: LoggedAnswer[];
  query: string;
  /** Drops a logged answer when its pill is dismissed. */
  onRemoveAnswer: (questionId: string) => void;
};

/**
 * The results rail: screening header with live counts, suppliers still
 * matching everything logged so far (best first), and a persistent action
 * footer — select all, contact, shortlist, export, save.
 */
export function SupplierResults({ answers, query, onRemoveAnswer }: SupplierResultsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState("");
  /** Classic facet rail, opened from "All Filters". */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [partnerOnly, setPartnerOnly] = useState(false);
  /** Checked options per facet group id. */
  const [facetPicks, setFacetPicks] = useState<Record<string, string[]>>({});

  const logged = answers.filter((answer) => !answer.skipped && answer.values.length > 0);

  const results = useMemo(() => {
    const candidates = candidatesFor(answers);
    const plan = planScreening(
      `${query} ${logged.map((answer) => answer.values.join(" ")).join(" ")}`,
      [],
    );
    const place = location.trim().toLowerCase();
    const inPlace = (supplier: Supplier) =>
      place === "" ||
      `${supplier.city}, ${supplier.state} ${supplier.zip}`.toLowerCase().includes(place);
    const types = facetPicks.companyType ?? [];
    const certs = facetPicks.certification ?? [];
    const passesFacets = (supplier: Supplier) =>
      (!verifiedOnly || supplier.verified === true) &&
      (types.length === 0 || types.some((type) => supplier.companyTypes.includes(type))) &&
      (certs.length === 0 || certs.some((cert) => supplier.certifications.includes(cert)));
    return candidates
      .filter((supplier) => inPlace(supplier) && passesFacets(supplier))
      .sort((a, b) => {
        const scoreDelta = scoreRecord(b, plan) - scoreRecord(a, plan);
        if (scoreDelta !== 0) return scoreDelta;
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
        return 0;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, query, location, verifiedOnly, facetPicks]);

  // Facet options come from the suppliers this category can return, so the rail
  // never offers a filter that would empty the list on its own.
  const filterGroups = useMemo<FilterGroup[]>(() => {
    const collect = (pick: (supplier: Supplier) => string[]) => {
      const values = new Set<string>();
      for (const supplier of candidatesFor([])) for (const value of pick(supplier)) values.add(value);
      return [...values].sort();
    };
    return [
      { id: "companyType", title: "Company Type", options: collect((s) => s.companyTypes) },
      { id: "certification", title: "Quality Certifications", options: collect((s) => s.certifications) },
      { id: "material", title: "Material", options: collect((s) => s.capabilities) },
    ];
  }, []);

  const filterCount =
    (verifiedOnly ? 1 : 0) +
    (partnerOnly ? 1 : 0) +
    (location.trim() ? 1 : 0) +
    Object.values(facetPicks).reduce((total, values) => total + values.length, 0);

  const clearFilters = () => {
    setVerifiedOnly(false);
    setPartnerOnly(false);
    setLocation("");
    setFacetPicks({});
  };

  const toggleFacet = (groupId: string, option: string) =>
    setFacetPicks((current) => {
      const chosen = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: chosen.includes(option)
          ? chosen.filter((entry) => entry !== option)
          : [...chosen, option],
      };
    });

  const facets = logged.map((answer) => ({
    id: answer.questionId,
    title: questionById(answer.questionId)?.title ?? "",
    value: answer.values.join(", "),
  }));

  const matchTotal = scaleToCategory(results.length);
  const atSelectionLimit = selected.size >= SELECTION_LIMIT;

  const toggleIn = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  return (
    <>
      <div className="results-header">
        <div className="flex align-items-center gap-2">
          <l-icon name="magnifying-glass" class="txt-blue-100 results-title-icon" aria-hidden="true" />
          <h3 className="mar-0">{CATEGORY_LABEL} Suppliers</h3>
        </div>
        <div className="results-meta">
          <p className="mar-0 txt-smaller txt-darkblue-75">
            <span className="txt-blue-100 font-semi">{matchTotal.toLocaleString()}</span> suppliers
            of {CATEGORY_SUPPLIER_COUNT.toLocaleString()} verified suppliers match your query.
          </p>
          <label className="location-search">
            <l-icon name="location-dot" aria-hidden="true" />
            <input
              type="search"
              value={location}
              aria-label="Filter by location"
              placeholder="Location by City, State, or ZIP"
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>
          <button type="button" className="all-filters" onClick={() => setFiltersOpen(true)}>
            <l-icon name="sliders" aria-hidden="true" />
            All Filters
            {filterCount > 0 && <span className="all-filters-count">{filterCount}</span>}
          </button>
        </div>
        {facets.length > 0 && (
          <div className="flex flex-wrap gap-2 mar-t-2">
            {facets.map((facet) => (
              <button
                type="button"
                className="answer-pill"
                key={facet.id}
                aria-label={`Remove ${facet.title}: ${facet.value}`}
                onClick={() => onRemoveAnswer(facet.id)}
              >
                {facet.value}
                <l-icon name="xmark" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pane-scroll">
        <div className="results-list">
          {results.slice(0, visibleCount).map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              saved={saved.has(supplier.id)}
              selected={selected.has(supplier.id)}
              selectDisabled={atSelectionLimit && !selected.has(supplier.id)}
              onToggleSave={() => setSaved((set) => toggleIn(set, supplier.id))}
              onToggleSelect={() => setSelected((set) => toggleIn(set, supplier.id))}
            />
          ))}
          {results.length === 0 && (
            <l-panel class="results-row-full">
              <p className="mar-0">
                No suppliers match every requirement yet. Try skipping the last answer or widening a
                constraint.
              </p>
            </l-panel>
          )}
          {results.length > visibleCount && (
            <div className="results-row-full flex justify-content-center pad-4">
              <button kind="neutral" scale="small" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Show more ({results.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="results-footer">
          <span className="selected-count">
            <l-icon name="check" aria-hidden="true" />
            {selected.size}/{SELECTION_LIMIT} Suppliers Selected
          </span>
          <div className="selected-names">
            {results
              .filter((supplier) => selected.has(supplier.id))
              .map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  className="name-pill"
                  aria-label={`Deselect ${supplier.name}`}
                  onClick={() => setSelected((set) => toggleIn(set, supplier.id))}
                >
                  {supplier.name} <l-icon name="xmark" />
                </button>
              ))}
          </div>
          <div className="footer-actions">
            <button kind="primary" scale="small">
              Request Quote
            </button>
            <button type="button" className="footer-ghost">
              Shortlist
            </button>
          </div>
        </div>
      )}

      <FilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        groups={filterGroups}
        picked={facetPicks}
        onTogglePicked={toggleFacet}
        verifiedOnly={verifiedOnly}
        onVerifiedOnly={setVerifiedOnly}
        partnerOnly={partnerOnly}
        onPartnerOnly={setPartnerOnly}
        location={location}
        onLocation={setLocation}
        selectedCount={filterCount}
        onClearAll={clearFilters}
      />
    </>
  );
}
