"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AskBlock } from "@/components/ask-block";
import { RegisterGate } from "@/components/register-gate";
import { SiteNavbar } from "@/components/site-navbar";
import { SupplierResults } from "@/components/supplier-results";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import {
  FREE_TEXT_ENABLED,
  impliedAnswers,
  introSummary,
  matchSetFor,
  mergeParsedAnswers,
  nextAsk,
  parseInitialQuery,
  questionById,
  railTarget,
  routesOutToDeepDrawing,
  SHORTLIST_TARGET,
  simulatedMatchCount,
  type LoggedAnswer,
  type NextAsk,
} from "@/lib/simulation";
import { CATEGORY_LABEL, CATEGORY_SUPPLIER_COUNT } from "@/lib/suppliers";

const WELCOME = "Tell us about your need and we'll refine your results.";

/**
 * The stall rule's "reasonable number of questions": a broad category that
 * hasn't refined below the shortlist target after this many asks completes
 * gracefully with the best set it has rather than asking on.
 */
const MAX_ASKS = 8;

const OPT_OUT_HINT =
  "Opt out of the Thomas Agent experience and go back to Thomas Classic sourcing";

type TranscriptEntry =
  | { kind: "user"; id: number; text: string }
  | { kind: "assistant"; id: number; text: string; logged?: LoggedAnswer[]; matchCount?: number }
  /** Terminal step: the run is over, either quotable or routed to another family. */
  | {
      kind: "done";
      id: number;
      routed?: boolean;
      text?: string;
      /** Suppliers in the category still matching everything logged. */
      matched?: number;
      /** How many of them the results rail is showing. */
      shortlist?: number;
      /** Stall rule: the run completed while still above the shortlist target. */
      stalled?: boolean;
    }
  | {
      kind: "ask";
      id: number;
      ask: NextAsk;
      status: "active" | "answered" | "skipped";
      /** What the buyer picked, shown on the settled question card. */
      answer?: string[];
    };

let entryId = 0;
function nextId(): number {
  return ++entryId;
}

/** The first core question — stamping process / method. */
function makeIntro(): TranscriptEntry[] {
  const ask = nextAsk([]);
  return ask ? [{ kind: "ask", id: nextId(), ask, status: "active" }] : [];
}

export function SourcingExperience() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(() => makeIntro());
  const [answers, setAnswers] = useState<LoggedAnswer[]>([]);
  // The category search that landed the buyer here — the experience's starting point.
  const [query, setQuery] = useState(CATEGORY_LABEL);
  const [draft, setDraft] = useState("");
  /** Options selected on the active ask, answered from the pinned bottom bar. */
  const [picked, setPicked] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  /** Whether the agent pane is open. Closing it hands the width to the rail. */
  const [agentOpen, setAgentOpen] = useState(true);
  /** Registration gate over the whole page, up until the buyer signs in. */
  const [gateOpen, setGateOpen] = useState(true);
  /** Left pane width in px; dragged via the divider. */
  const [leftWidth, setLeftWidth] = useState(640);
  const [dragging, setDragging] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timeouts = timers.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, thinking]);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const startDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }, []);

  const onDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      // Never narrower than a readable question card, never past 70% of the split.
      const width = event.clientX - rect.left;
      setLeftWidth(Math.min(rect.width * 0.7, Math.max(360, width)));
    },
    [dragging],
  );

  const endDrag = useCallback(() => setDragging(false), []);

  /** Queue the next question, or wrap up when nothing is left worth asking. */
  const advance = useCallback(
    (currentAnswers: LoggedAnswer[]) => {
      setThinking(true);
      later(700, () => {
        setThinking(false);
        if (routesOutToDeepDrawing(currentAnswers)) {
          setTranscript((entries) => [
            ...entries,
            {
              kind: "done",
              id: nextId(),
              routed: true,
              text: "Parts with formed depth greater than width are deep drawn, which is quoted by the Deep Drawing Services family rather than stamping. I'll route this need there — no further stamping questions apply.",
            },
          ]);
          return;
        }
        // The stop condition: questions continue only while the match set
        // still exceeds the shortlist target. At 20 or below — or when no
        // refining question remains — the run stops and presents the results.
        const matched = simulatedMatchCount(currentAnswers);
        const ask = matched > SHORTLIST_TARGET ? nextAsk(currentAnswers) : null;
        setTranscript((entries) => {
          // Stall rule: after a reasonable number of questions a category
          // that won't refine below the target completes gracefully.
          const asked = entries.filter((entry) => entry.kind === "ask").length;
          if (ask && asked < MAX_ASKS) {
            return [...entries, { kind: "ask" as const, id: nextId(), ask, status: "active" as const }];
          }
          // Sized to what the rail actually shows, so the completion copy and
          // the results header never quote two different shortlists.
          const matchSet = matchSetFor(currentAnswers, railTarget(matched));
          return [
            ...entries,
            {
              kind: "done" as const,
              id: nextId(),
              matched,
              shortlist: matchSet.matches.length + matchSet.near.length,
              stalled: matched > SHORTLIST_TARGET,
            },
          ];
        });
      });
    },
    [later],
  );

  /** Start the need-definition flow from a free-text part description. */
  const begin = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setQuery(trimmed);
      setTranscript((entries) => [...entries, { kind: "user", id: nextId(), text: trimmed }]);
      setThinking(true);
      later(900, () => {
        const parsed = parseInitialQuery(trimmed);
        const all = [...parsed, ...impliedAnswers(parsed)];
        setAnswers(all);
        setThinking(false);
        // Settle the opening ask: covered by the description → answered;
        // otherwise drop it, since advance() re-asks it with pruned options.
        const covered = new Set(all.map((answer) => answer.questionId));
        setTranscript((entries) => [
          ...entries
            .filter(
              (entry) =>
                !(entry.kind === "ask" && entry.status === "active" && !covered.has(entry.ask.question.id)),
            )
            .map((entry) => {
              if (entry.kind !== "ask" || entry.status !== "active") return entry;
              const covering = all.find((answer) => answer.questionId === entry.ask.question.id);
              return { ...entry, status: "answered" as const, answer: covering?.values };
            }),
          {
            kind: "assistant",
            id: nextId(),
            text: introSummary(parsed),
            logged: all,
            matchCount: simulatedMatchCount(all),
          },
        ]);
        advance(all);
      });
    },
    [advance, later],
  );

  const answerActive = useCallback(
    (values: string[], skipped: boolean, freeText?: string) => {
      const active = transcript.find(
        (entry): entry is Extract<TranscriptEntry, { kind: "ask" }> =>
          entry.kind === "ask" && entry.status === "active",
      );
      if (!active) return;
      const question = active.ask.question;

      let updated: LoggedAnswer[] = [...answers, { questionId: question.id, values, skipped }];
      // A typed answer may cover other questions too — never ask those again.
      let covered: LoggedAnswer[] = [];
      if (freeText) {
        const merge = mergeParsedAnswers(updated, parseInitialQuery(freeText));
        updated = merge.merged;
        covered = merge.added;
      }
      const implied = impliedAnswers(updated);
      updated = [...updated, ...implied];
      const extras = [...covered, ...implied];

      setAnswers(updated);
      setPicked([]);
      setTranscript((entries) => [
        ...entries.map((entry) =>
          entry.id === active.id && entry.kind === "ask"
            ? {
                ...entry,
                status: skipped ? ("skipped" as const) : ("answered" as const),
                answer: values,
              }
            : entry,
        ),
        ...(extras.length > 0
          ? [
              {
                kind: "assistant" as const,
                id: nextId(),
                text: "That also answers a later question — logged, so it won't be asked:",
                logged: extras,
              },
            ]
          : []),
      ]);
      advance(updated);
    },
    [advance, answers, transcript],
  );

  /** Free text after the questions ran out: refine the need without a prompt. */
  const refine = useCallback(
    (text: string) => {
      setTranscript((entries) => [...entries, { kind: "user", id: nextId(), text }]);
      setThinking(true);
      later(700, () => {
        setThinking(false);
        const { merged, added } = mergeParsedAnswers(answers, parseInitialQuery(text));
        if (added.length === 0) {
          setTranscript((entries) => [
            ...entries,
            {
              kind: "assistant",
              id: nextId(),
              text: "Noted — that detail goes on the RFQ. It doesn't map to a supplier capability, so the match list is unchanged.",
            },
          ]);
          return;
        }
        setAnswers(merged);
        setTranscript((entries) => [
          ...entries,
          {
            kind: "assistant",
            id: nextId(),
            text: "Logged — the match list is updated.",
            logged: added,
            matchCount: simulatedMatchCount(merged),
          },
        ]);
      });
    },
    [answers, later],
  );

  const submitDraft = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const text = draft.trim();
      if (!text || thinking) return;
      setDraft("");
      const started = transcript.some((entry) => entry.kind === "user");
      if (!started) {
        // The first message is the part description itself — parse the lot.
        begin(text);
        return;
      }
      const hasActiveAsk = transcript.some((entry) => entry.kind === "ask" && entry.status === "active");
      if (hasActiveAsk) {
        answerActive([text], false, text);
        return;
      }
      refine(text);
    },
    [answerActive, begin, draft, refine, thinking, transcript],
  );

  /**
   * Dismissing an answer pill in the results rail. The question card leaves the
   * transcript along with the answer, so it reads as never asked and the run
   * stays numbered 1..n. It's re-asked on the next advance; if a question is
   * already on screen, that happens when the buyer answers it.
   */
  const removeAnswer = useCallback(
    (questionId: string) => {
      const updated = answers.filter((answer) => answer.questionId !== questionId);
      setAnswers(updated);
      setTranscript((entries) =>
        entries.filter((entry) => !(entry.kind === "ask" && entry.ask.question.id === questionId)),
      );
      const hasActive = transcript.some((entry) => entry.kind === "ask" && entry.status === "active");
      if (!hasActive) advance(updated);
    },
    [advance, answers, transcript],
  );

  /**
   * Reopen a settled question: everything the run logged from that question
   * onwards is rolled back, so the buyer lands on it with a clean slate and
   * answers it forward again from there.
   */
  const reopenAsk = useCallback((entryId: number) => {
    const index = transcript.findIndex((entry) => entry.id === entryId);
    if (index === -1) return;
    const target = transcript[index];
    if (target.kind !== "ask") return;
    // A queued advance would land a second active question on the rolled-back
    // transcript, so the run stops where it is before rewinding.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThinking(false);

    const rolledBack = new Set<string>();
    for (const entry of transcript.slice(index)) {
      if (entry.kind === "ask") rolledBack.add(entry.ask.question.id);
      if (entry.kind === "assistant") {
        for (const logged of entry.logged ?? []) rolledBack.add(logged.questionId);
      }
    }
    setAnswers((current) => current.filter((answer) => !rolledBack.has(answer.questionId)));
    // A reopened question starts blank rather than with the previous pick,
    // so nothing reads as pre-selected while the buyer reconsiders.
    setPicked([]);
    setTranscript((entries) =>
      entries
        .slice(0, index + 1)
        .map((entry) =>
          entry.id === target.id && entry.kind === "ask"
            ? { ...entry, status: "active" as const, answer: undefined }
            : entry,
        ),
    );
  }, [transcript]);

  /** Step back into the question answered most recently. */
  const goBack = useCallback(() => {
    const target = transcript.findLast(
      (entry) => entry.kind === "ask" && entry.status !== "active",
    );
    if (target) reopenAsk(target.id);
  }, [reopenAsk, transcript]);

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTranscript(makeIntro());
    setAnswers([]);
    setQuery(CATEGORY_LABEL);
    setDraft("");
    setPicked([]);
    setThinking(false);
    setAgentOpen(true);
  }, []);

  const activeAsk = transcript.find(
    (entry): entry is Extract<TranscriptEntry, { kind: "ask" }> =>
      entry.kind === "ask" && entry.status === "active",
  );
  const hasActiveAsk = activeAsk != null;
  const started = transcript.some((entry) => entry.kind === "user");
  /** Suppliers still matching everything logged — the header's live count. */
  const liveMatch = simulatedMatchCount(answers);
  const canGoBack = transcript.some((entry) => entry.kind === "ask" && entry.status !== "active");
  // There is no fixed question count to show progress against, so the header
  // bar tracks the narrowing itself: how far the count has come down from the
  // whole category toward the shortlist target, on a log scale so the early
  // answers (which cut the most suppliers) don't swallow the whole bar.
  const narrowing = Math.min(
    1,
    Math.log(CATEGORY_SUPPLIER_COUNT / Math.max(liveMatch, SHORTLIST_TARGET)) /
      Math.log(CATEGORY_SUPPLIER_COUNT / SHORTLIST_TARGET),
  );
  // Numbered by the order they were actually asked, so the run reads 1, 2, 3
  // even when the flow drops questions the supplier data can't narrow.
  const askPositions = new Map<number, number>();
  for (const entry of transcript) {
    if (entry.kind === "ask") askPositions.set(entry.id, askPositions.size + 1);
  }

  /** Picking an option answers the question outright and moves the run on. */
  const selectOption = (value: string) => {
    if (thinking) return;
    answerActive([value], false);
  };

  return (
    <div className="app-shell">
      <RegisterGate open={gateOpen} onDismiss={() => setGateOpen(false)} />
      <SiteNavbar
        query={query}
        onSearch={(text) => {
          reset();
          const trimmed = text.trim();
          // A specific need typed into the search starts the flow directly;
          // the bare category search restarts at the goal step.
          if (trimmed && trimmed.toLowerCase() !== CATEGORY_LABEL.toLowerCase()) {
            begin(trimmed);
          }
        }}
      />

      <main
        className="app-main"
        ref={mainRef}
        data-dragging={dragging || undefined}
        data-agent-closed={!agentOpen || undefined}
        style={{ gridTemplateColumns: agentOpen ? `${leftWidth}px auto 1fr` : "1fr" }}
      >
        {/* Left: define your need */}
        <section className="pane pane-left" aria-label="Define your need" hidden={!agentOpen}>
          <div className="agent-card">
            <div className="agent-header">
              <span className="agent-badge" aria-hidden="true">
                <l-icon name="sparkles" fill />
              </span>
              <div className="flex-1">
                {/* Non-breaking space keeps "in" with "seconds" when it wraps. */}
                <h4 className="mar-0">Build your perfect supplier shortlist in&nbsp;seconds</h4>
                <p className="agent-welcome mar-0">{WELCOME}</p>
              </div>
              <div className="agent-aside">
                {/* Goes green once the count is down to a presentable shortlist. */}
                <span className="agent-count" data-near={liveMatch <= SHORTLIST_TARGET || undefined}>
                  <strong>{liveMatch.toLocaleString()}</strong>
                  Matched suppliers
                </span>
              </div>
              <div
                className="agent-progress"
                role="progressbar"
                aria-label="Narrowing toward your shortlist"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(narrowing * 100)}
              >
                <span style={{ width: `${narrowing * 100}%` }} />
              </div>
            </div>
            <div className="agent-body" ref={scrollRef} data-floating-actions={activeAsk ? true : undefined}>
            <div className="transcript">
              {transcript.map((entry) => {
                if (entry.kind === "user") {
                  return (
                    <div key={entry.id} className="chat-user">
                      {entry.text}
                    </div>
                  );
                }
                if (entry.kind === "assistant") {
                  return (
                    <div key={entry.id} className="chat-assistant flex flex-col gap-2">
                      {entry.text.split("\n\n").map((paragraph, index) => (
                        <p key={index} className="mar-0">
                          {paragraph}
                        </p>
                      ))}
                      {entry.logged && entry.logged.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.logged.map((logged) => {
                            const question = questionById(logged.questionId);
                            return (
                              <l-chip kind="primary" key={logged.questionId}>
                                {question?.title}: {logged.values.join(", ")} · logged
                              </l-chip>
                            );
                          })}
                        </div>
                      )}
                      {entry.matchCount !== undefined && (
                        <p className="mar-0 font-semi txt-blue-100">
                          {entry.matchCount.toLocaleString()} suppliers matching your need
                        </p>
                      )}
                    </div>
                  );
                }
                if (entry.kind === "done") {
                  return (
                    <l-panel key={entry.id}>
                      <div className="done-card">
                        <span className="done-mark">
                          <ThinkingIndicator state="done" size={28} />
                          <span className="done-check" aria-hidden="true">
                            <l-icon name="check" />
                          </span>
                        </span>
                        <h3 className="done-title mar-0">
                          {entry.routed
                            ? "This need is quoted by Deep Drawing Services"
                            : entry.stalled
                              ? "This is the best set we can give you"
                              : "Based on what you've told us, these are the suppliers best matched to your need"}
                        </h3>
                        <p className="mar-0 done-copy">
                          {entry.routed
                            ? entry.text
                            : `${
                                entry.stalled
                                  ? `Nothing left to ask would materially narrow this category below ${(entry.matched ?? 0).toLocaleString()} suppliers. `
                                  : ""
                              }${
                                entry.shortlist
                                  ? `The ${entry.shortlist} best matches are ranked in your results. `
                                  : ""
                              }You can restart your search any time or close the agent below.${
                                FREE_TEXT_ENABLED
                                  ? " You can also keep typing details like certifications, industry, or supplier location."
                                  : ""
                              }`}
                        </p>
                        <div className="done-actions">
                          <button kind="neutral" onClick={reset}>
                            <l-icon name="arrow-rotate-left" /> Restart search
                          </button>
                          <button kind="primary" onClick={() => setAgentOpen(false)}>
                            Close agent
                          </button>
                        </div>
                      </div>
                    </l-panel>
                  );
                }
                return (
                  <AskBlock
                    key={entry.id}
                    ask={entry.ask}
                    status={entry.status}
                    answer={entry.answer}
                    position={askPositions.get(entry.id) ?? 1}
                    picked={picked}
                    onSelect={selectOption}
                    onEdit={entry.status === "active" ? undefined : () => reopenAsk(entry.id)}
                  />
                );
              })}

              {thinking && (
                <div className="thinking-row">
                  <ThinkingIndicator label="Matching suppliers" />
                  <small>Matching suppliers…</small>
                </div>
              )}
            </div>
            </div>

            {activeAsk && (
              <div className="agent-footer">
                {FREE_TEXT_ENABLED && (
                  <form className="composer flex gap-2 align-items-center" onSubmit={submitDraft}>
                    <fieldset className="flex-1">
                      <input
                        type="text"
                        value={draft}
                        aria-label="Your answer"
                        placeholder={
                          !started
                            ? "Write a message…"
                            : hasActiveAsk
                              ? "Tap an option above, or type your own answer…"
                              : "Add anything else about your need…"
                        }
                        onChange={(event) => setDraft(event.target.value)}
                      />
                    </fieldset>
                    <button kind="primary" type="submit" disabled={thinking}>
                      <l-icon name="paper-plane" /> Send
                    </button>
                  </form>
                )}
                <div className="answer-actions">
                  <button className="ghost-button" type="button" disabled={!canGoBack} onClick={goBack}>
                    <l-icon name="arrow-left" /> Back
                  </button>
                  <button className="ghost-button" type="button" onClick={() => answerActive([], true)}>
                    Skip <l-icon name="arrow-right" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* The divider hides with the agent pane; the rail is always up. */}
        <div
          className="app-divider"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          hidden={!agentOpen}
          data-dragging={dragging || undefined}
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />

        {/* Right: supplier results */}
        <section className="pane" aria-label="Supplier results">
          <SupplierResults answers={answers} query={query} onRemoveAnswer={removeAnswer} />
        </section>

        {agentOpen ? (
          <button
            type="button"
            className="exit-agent"
            title={OPT_OUT_HINT}
            onClick={() => setAgentOpen(false)}
          >
            Exit Agent <l-icon name="circle-info" />
          </button>
        ) : (
          <button type="button" className="agent-tab" onClick={() => setAgentOpen(true)}>
            <l-icon name="sparkles" fill /> Sourcing Agent
          </button>
        )}
      </main>
    </div>
  );
}
