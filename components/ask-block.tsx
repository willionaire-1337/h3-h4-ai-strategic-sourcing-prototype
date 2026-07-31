"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { NextAsk } from "@/lib/simulation";

/** Most rows of options to offer, however tall the window gets. */
const MAX_OPTION_ROWS = 6;
/** Rows assumed until the grid has been measured, in two-column terms. */
const ASSUMED_VISIBLE = 8;

type AskBlockProps = {
  ask: NextAsk;
  status: "active" | "answered" | "skipped";
  /** What the buyer picked, shown in place of the option rows once settled. */
  answer?: string[];
  /** 1-based place in the run of questions, shown in the step line. */
  position: number;
  /** Core questions in the run, the denominator of the step line. */
  total: number;
  /** Selection for the active ask, restored when a question is reopened. */
  picked: string[];
  onSelect: (value: string) => void;
  /** Reopens a settled question so the buyer can change what they picked. */
  onEdit?: () => void;
};

/**
 * How many options fit on screen without the buyer having to scroll: as many
 * rows as the pane is tall enough for, capped at MAX_OPTION_ROWS, always
 * leaving the last row for "+N more options" when anything is left over.
 *
 * Measured off the question's own header height rather than the grid's
 * position in the scroller, since the transcript is pinned to the bottom and
 * the active question is what has to fit.
 */
function useFittedOptionCount(gridRef: React.RefObject<HTMLDivElement | null>, total: number) {
  const [fitted, setFitted] = useState(ASSUMED_VISIBLE);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const scroller = grid?.closest(".agent-body");
    if (!grid || !scroller) return;

    const measure = () => {
      const row = grid.firstElementChild;
      const block = grid.parentElement;
      if (!row || !block) return;

      const gridStyles = getComputedStyle(grid);
      const columns = gridStyles.gridTemplateColumns.split(" ").length;
      const gap = parseFloat(gridStyles.rowGap) || 0;
      const rowHeight = row.getBoundingClientRect().height;
      if (!rowHeight) return;

      // The scroller's own padding already reserves room for the floating
      // Back / Skip controls, so what's left is the block's to fill.
      const scrollerStyles = getComputedStyle(scroller);
      const header = grid.getBoundingClientRect().top - block.getBoundingClientRect().top;
      const room =
        scroller.clientHeight -
        parseFloat(scrollerStyles.paddingTop) -
        parseFloat(scrollerStyles.paddingBottom) -
        header;

      const rows = Math.min(MAX_OPTION_ROWS, Math.max(1, Math.floor((room + gap) / (rowHeight + gap))));
      // Everything fits, or one row goes to "+N more options".
      setFitted(rows * columns >= total ? total : Math.max(columns, (rows - 1) * columns));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef, total]);

  return fitted;
}

/**
 * One question in the run: step line, the question itself, and its option
 * rows. Picking an option answers the question outright; Back / Skip float
 * over the foot of the card.
 */
export function AskBlock({
  ask,
  status,
  answer,
  position,
  total,
  picked,
  onSelect,
  onEdit,
}: AskBlockProps) {
  const { question, options } = ask;
  const [expanded, setExpanded] = useState(false);

  const active = status === "active";
  const gridRef = useRef<HTMLDivElement>(null);
  const fitted = useFittedOptionCount(gridRef, active ? options.length : 0);

  const visible = expanded ? options : options.slice(0, fitted);
  const hiddenCount = options.length - visible.length;

  const edit = onEdit ? (
    <button
      type="button"
      className="ask-edit"
      title="Change this answer"
      aria-label={`Change your answer to ${question.title}`}
      onClick={onEdit}
    >
      <l-icon name="pen" />
    </button>
  ) : null;

  return (
    <div className="ask-block" aria-disabled={active ? undefined : true}>
      <div className="kicker ask-kicker">
        Question {position} of {total} · {question.title}
      </div>
      <h5 className="ask-question mar-0">{question.ask}</h5>
      {active && (
        <p className="ask-help mar-0">
          {question.multi
            ? "Pick every option that applies — each answer narrows the list."
            : "Pick the closest match — each answer narrows the list."}
        </p>
      )}

      {!active &&
        (status === "skipped" || !answer?.length ? (
          <p className="mar-0 ask-settled txt-darkblue-50">
            Skipped
            {edit}
          </p>
        ) : (
          <p className="mar-0 ask-settled ask-answer">
            <l-icon name="check" aria-hidden="true" />
            {answer.join(", ")}
            {edit}
          </p>
        ))}

      {active &&
        (options.length > 0 ? (
          <div className="option-rows" role="group" aria-label={question.title} ref={gridRef}>
            {visible.map((option) => (
              <button
                key={option}
                type="button"
                className="option-row"
                aria-pressed={picked.includes(option)}
                onClick={() => onSelect(option)}
              >
                <span
                  className="row-indicator"
                  data-single={question.multi ? undefined : true}
                  aria-hidden="true"
                >
                  {picked.includes(option) && <l-icon name="check" />}
                </span>
                {option}
              </button>
            ))}
            {hiddenCount > 0 && (
              <button type="button" className="option-row row-more" onClick={() => setExpanded(true)}>
                +{hiddenCount} more options
              </button>
            )}
          </div>
        ) : (
          <small className="txt-darkblue-50">Free-form answer — skip to move on.</small>
        ))}
    </div>
  );
}
