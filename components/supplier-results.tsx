"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { FilterDrawer, type FilterGroup } from "@/components/filter-drawer";
import { SupplierCard } from "@/components/supplier-card";
import {
  capabilitiesForMaterials,
  certificationsForAnswers,
  locationFromAnswers,
  mapCertificationOption,
  materialsFromCapabilities,
} from "@/lib/filter-sync";
import {
  questionById,
  candidatesFor,
  LOCATION_QUESTION_ID,
  MATCH_FLOOR,
  matchSetFor,
  railTarget,
  simulatedMatchCount,
  type LoggedAnswer,
} from "@/lib/simulation";
import { planScreening, scoreRecord } from "@/lib/screening";
import { CATEGORY_SUPPLIER_COUNT, type Supplier } from "@/lib/suppliers";

const PAGE_SIZE = 25;
/** Suppliers one quote request can go out to. */
const SELECTION_LIMIT = 5;

/** Short uppercase label shown above each answer chip in the results header. */
const FACET_LABELS: Record<string, string> = {
  process: "PROCESS",
  material: "MATERIAL",
  stock: "THICKNESS",
  qty: "QUANTITY",
  size: "SIZE",
  tooling: "TOOLING",
  tol: "TOLERANCE",
  loc: "LOCATION",
  features: "FEATURES",
  part: "PART TYPE",
  app: "INDUSTRY",
  cert: "CERTIFICATIONS",
  diverse: "DIVERSITY",
};

type SupplierResultsProps = {
  answers: LoggedAnswer[];
  query: string;
  /** Drops a logged answer when its pill is dismissed. */
  onRemoveAnswer: (questionId: string) => void;
  /** Writes a mapped All Filters pick into the agent answers (or clears it). */
  onApplyFilterAnswer: (questionId: string, values: string[] | null) => void;
  /** Clears every questionnaire-backed drawer facet in one shot. */
  onClearMappedAnswers: () => void;
};

/**
 * The results rail: screening header with live counts, suppliers still
 * matching everything logged so far (best first), and a persistent action
 * footer — select all, contact, shortlist, export, save.
 */
export function SupplierResults({
  answers,
  query,
  onRemoveAnswer,
  onApplyFilterAnswer,
  onClearMappedAnswers,
}: SupplierResultsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** Draft for the drawer location field while typing; commits into answers. */
  const [locationDraft, setLocationDraft] = useState("");
  /** Classic facet rail, opened from "All Filters". */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [partnerOnly, setPartnerOnly] = useState(false);
  /** Local-only facets (no questionnaire twin) — e.g. company type. */
  const [localFacetPicks, setLocalFacetPicks] = useState<Record<string, string[]>>({});
  /** Soft shadow under the sticky header once the results list has scrolled. */
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const locationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logged = answers.filter((answer) => !answer.skipped && answer.values.length > 0);

  // Keep the drawer location field aligned with the loc answer when it changes
  // from the left rail (or a committed drawer edit).
  const answerLocation = locationFromAnswers(answers);
  useEffect(() => {
    if (answerLocation === null) {
      setLocationDraft("");
      return;
    }
    setLocationDraft(answerLocation);
  }, [answerLocation]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > 0);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (locationTimer.current) clearTimeout(locationTimer.current);
    };
  }, []);

  /** Suppliers in the category still matching — the number the buyer is shown. */
  const matchTotal = simulatedMatchCount(answers);

  // Exact matches rank above any near matches the rail was padded with, so a
  // relaxed answer never pushes a supplier that meets everything down the list.
  const { exact, near, backfilled, relaxed } = useMemo(() => {
    const set = matchSetFor(answers, railTarget(matchTotal));
    const plan = planScreening(
      `${query} ${logged.map((answer) => answer.values.join(" ")).join(" ")}`,
      [],
    );
    const types = localFacetPicks.companyType ?? [];
    const passesFacets = (supplier: Supplier) =>
      (!verifiedOnly || supplier.verified === true) &&
      (types.length === 0 || types.some((type) => supplier.companyTypes.includes(type)));
    const rank = (group: Supplier[]) =>
      group
        .filter((supplier) => passesFacets(supplier))
        .sort((a, b) => {
          const scoreDelta = scoreRecord(b, plan) - scoreRecord(a, plan);
          if (scoreDelta !== 0) return scoreDelta;
          if (a.verified !== b.verified) return a.verified ? -1 : 1;
          if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
          return 0;
        });
    return {
      exact: rank(set.matches),
      near: rank(set.near),
      backfilled: set.backfilled,
      relaxed: set.relaxed,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, matchTotal, query, verifiedOnly, localFacetPicks]);

  const results = useMemo(() => [...exact, ...near], [exact, near]);

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

  const materialOptions =
    filterGroups.find((group) => group.id === "material")?.options ?? [];
  const certificationOptions =
    filterGroups.find((group) => group.id === "certification")?.options ?? [];

  // Mapped facets are derived from answers so the drawer and left rail stay in sync.
  const materialAnswer = logged.find((answer) => answer.questionId === "material");
  const syncedCertifications = certificationsForAnswers(answers, certificationOptions);
  const localCertifications = (localFacetPicks.certification ?? []).filter(
    (option) => mapCertificationOption(option) == null,
  );
  const facetPicks: Record<string, string[]> = {
    ...localFacetPicks,
    material: capabilitiesForMaterials(materialAnswer?.values ?? [], materialOptions),
    certification: [...syncedCertifications, ...localCertifications],
  };

  const filterCount =
    (verifiedOnly ? 1 : 0) +
    (partnerOnly ? 1 : 0) +
    (locationDraft.trim() ? 1 : 0) +
    Object.values(facetPicks).reduce((total, values) => total + values.length, 0);

  const clearFilters = () => {
    setVerifiedOnly(false);
    setPartnerOnly(false);
    setLocationDraft("");
    setLocalFacetPicks({});
    if (locationTimer.current) clearTimeout(locationTimer.current);
    onClearMappedAnswers();
  };

  const commitLocation = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      onApplyFilterAnswer(LOCATION_QUESTION_ID, null);
      return;
    }
    onApplyFilterAnswer(LOCATION_QUESTION_ID, [trimmed]);
  };

  const onLocation = (value: string) => {
    setLocationDraft(value);
    if (locationTimer.current) clearTimeout(locationTimer.current);
    locationTimer.current = setTimeout(() => commitLocation(value), 400);
  };

  const toggleFacet = (groupId: string, option: string) => {
    if (groupId === "material") {
      const currentCaps = new Set(facetPicks.material ?? []);
      if (currentCaps.has(option)) currentCaps.delete(option);
      else currentCaps.add(option);
      const materials = materialsFromCapabilities([...currentCaps]);
      onApplyFilterAnswer("material", materials.length > 0 ? materials : null);
      return;
    }

    if (groupId === "certification") {
      const mapped = mapCertificationOption(option);
      if (!mapped) {
        // No questionnaire twin — keep it local only.
        setLocalFacetPicks((current) => {
          const chosen = current[groupId] ?? [];
          return {
            ...current,
            [groupId]: chosen.includes(option)
              ? chosen.filter((entry) => entry !== option)
              : [...chosen, option],
          };
        });
        return;
      }

      const questionAnswers =
        answers.find((answer) => answer.questionId === mapped.questionId && !answer.skipped)
          ?.values ?? [];
      const next = questionAnswers.includes(mapped.value)
        ? questionAnswers.filter((value) => value !== mapped.value)
        : [...questionAnswers, mapped.value];
      onApplyFilterAnswer(mapped.questionId, next.length > 0 ? next : null);
      return;
    }

    setLocalFacetPicks((current) => {
      const chosen = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: chosen.includes(option)
          ? chosen.filter((entry) => entry !== option)
          : [...chosen, option],
      };
    });
  };

  const facets = logged.map((answer) => ({
    id: answer.questionId,
    title: questionById(answer.questionId)?.title ?? "",
    label: FACET_LABELS[answer.questionId] ?? (questionById(answer.questionId)?.title ?? "").toUpperCase(),
    value: answer.values.join(", "),
  }));

  const atSelectionLimit = selected.size >= SELECTION_LIMIT;

  const toggleIn = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  return (
    <>
      <div className="results-header" data-scrolled={scrolled || undefined}>
        <div className="results-meta">
          <div className="results-headline">
            <h3 className="mar-0">Suppliers that match your spec</h3>
            <p className="mar-0 txt-smaller txt-darkblue-75">
              <span className="txt-blue-100 font-semi">{matchTotal.toLocaleString()}</span> suppliers
              of {CATEGORY_SUPPLIER_COUNT.toLocaleString()} verified suppliers match your query.
            </p>
          </div>
          {/* Location left the header: it's asked as question 3 in the agent
              flow now, and remains available in the All Filters drawer. */}
          <button
            type="button"
            className="all-filters"
            aria-label="All Filters"
            onClick={() => setFiltersOpen(true)}
          >
            <l-icon name="sliders" aria-hidden="true" />
            <span className="all-filters-label">All Filters</span>
            {filterCount > 0 && <span className="all-filters-count">{filterCount}</span>}
          </button>
        </div>
        {facets.length > 0 && (
          <div className="answer-pill-row">
            {facets.map((facet) => (
              <div className="answer-pill-stack" key={facet.id}>
                <span className="answer-pill-label">{facet.label}</span>
                <button
                  type="button"
                  className="answer-pill"
                  aria-label={`Remove ${facet.title}: ${facet.value}`}
                  onClick={() => onRemoveAnswer(facet.id)}
                >
                  {facet.value}
                  <l-icon name="xmark" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pane-scroll" ref={scrollRef}>
        <div className="results-list">
          {results.slice(0, visibleCount).map((supplier, index) => (
            <Fragment key={supplier.id}>
              {/* The floor rule's divider. Backfill also pads the rail when the
                  104-profile slice runs dry while the modeled category count is
                  still healthy; that padding stands in for real matches the
                  slice doesn't hold, so only a genuine floor-rule backfill —
                  the set itself under the floor — is called out, labeled with
                  the answer that was relaxed to refill it. */}
              {backfilled && matchTotal < MATCH_FLOOR && index === exact.length && (
                <div className="results-row-full near-match-note">
                  <l-icon name="circle-info" aria-hidden="true" />
                  <p className="mar-0">
                    {relaxed.length > 0
                      ? `Closest matches — these meet everything you've asked for except ${relaxed[0]}.`
                      : "Closest matches — these meet most of your requirements, but not all."}
                  </p>
                </div>
              )}
              <SupplierCard
                supplier={supplier}
                saved={saved.has(supplier.id)}
                selected={selected.has(supplier.id)}
                selectDisabled={atSelectionLimit && !selected.has(supplier.id)}
                onToggleSave={() => setSaved((set) => toggleIn(set, supplier.id))}
                onToggleSelect={() => setSelected((set) => toggleIn(set, supplier.id))}
              />
            </Fragment>
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
        location={locationDraft}
        onLocation={onLocation}
        selectedCount={filterCount}
        onClearAll={clearFilters}
      />
    </>
  );
}
