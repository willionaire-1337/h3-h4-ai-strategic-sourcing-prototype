import { ALL_CANDIDATES, narrowCandidates, planField } from "./ask-viability"
import { QUESTIONNAIRE, type Question } from "./questionnaire"
import { CATEGORY_SUPPLIER_COUNT, type Supplier } from "./suppliers"

/**
 * The simulated assistant. Where the previous prototype streamed a live LLM,
 * this one is deterministic: the buyer's first message is parsed against the
 * questionnaire for anything already specified, and the remaining questions
 * are asked one at a time in importance order, with options pruned to what the
 * supplier database can still fulfil.
 */

/**
 * Tier 1 is rules based: the buyer answers with the option rows, so the
 * free-text composer and the copy that points at it are hidden. Flip this back
 * on when the phase that interprets typed answers lands.
 */
export const FREE_TEXT_ENABLED = false

export type LoggedAnswer = {
  questionId: string
  /** Option values chosen, or a free-form entry as a single value. */
  values: string[]
  /** True when the buyer skipped or answered "not sure". */
  skipped?: boolean
}

/**
 * Phrases buyers write that the option lists don't say verbatim. Each maps to
 * a question id and the exact option value to log.
 */
const PHRASE_MAP: [RegExp, string, string][] = [
  [/\btight(er)? tolerances?\b/, "tol", "Close tolerance"],
  [/\bclose tolerances?\b/, "tol", "Close tolerance"],
  [/\bhigh precision\b/, "tol", "High precision"],
  [/\bprecision\b/, "tol", "Precision"],
  [/\bproduction\s+(quantit|volume|run|qty)/, "qty", "Production Runs"],
  [/\bhigh volume\b/, "qty", "High Volume"],
  [/\bprototype/, "qty", "Prototype"],
  [/\bshort run/, "qty", "Short Run"],
  [/\blong run/, "qty", "Long Run"],
  [/\bstainless\b/, "material", "Stainless Steel"],
  [/\bprog(ressive)? die\b/, "process", "Progressive Die"],
  [/\bfine ?blank/, "process", "Fine blanking"],
  [/\bdeep draw/, "process", "Deep drawing"],
  [/\bfourslide\b/, "process", "Fourslide"],
  [/\bheat treat/, "features", "Heat treated"],
  [/\bplating|plated\b/, "features", "Plating"],
  [/\bassembly\b/, "features", "Assembly"],
]

/** Option values too generic to log off a free-text mention. */
const IGNORED_OPTION_MATCHES = new Set(["Metal", "Production Runs"])

/**
 * Read the buyer's opening message for answers they already gave — "aluminum
 * production quantity tight tolerance stamping services" logs material,
 * quantity, and tolerance before the first question is ever asked.
 */
export function parseInitialQuery(query: string): LoggedAnswer[] {
  const text = query.toLowerCase()
  const byQuestion = new Map<string, Set<string>>()

  const log = (questionId: string, value: string) => {
    const set = byQuestion.get(questionId) ?? new Set()
    set.add(value)
    byQuestion.set(questionId, set)
  }

  for (const [pattern, questionId, value] of PHRASE_MAP) {
    if (pattern.test(text)) log(questionId, value)
  }

  for (const question of QUESTIONNAIRE) {
    for (const option of question.options) {
      const value = option.value.toLowerCase().replace(/[®™]/g, "")
      if (value.length < 4) continue
      if (IGNORED_OPTION_MATCHES.has(option.value)) continue
      const escaped = value.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&")
      if (new RegExp(`\\b${escaped}s?\\b`).test(text)) {
        log(question.id, option.value)
      }
    }
  }

  const answers: LoggedAnswer[] = []
  for (const question of QUESTIONNAIRE) {
    const values = byQuestion.get(question.id)
    if (!values) continue
    const picked = question.multi ? [...values] : [...values].slice(0, 1)
    answers.push({ questionId: question.id, values: picked })
  }
  return answers
}

export function questionById(id: string): Question | undefined {
  return QUESTIONNAIRE.find((question) => question.id === id)
}

/**
 * Answers that already answer a later question, so it is never asked. Kept to
 * implications the taxonomy actually supports — a foil part has its thickness
 * class by definition; fine blanking produces fully sheared edges.
 */
const IMPLICATIONS: { source: [string, string]; implies: [string, string] }[] = [
  { source: ["material", "Foil"], implies: ["stock", "Foil gauge"] },
  { source: ["process", "Fine blanking"], implies: ["features", "Fully sheared edges"] },
]

/** Answers implied by what's already logged, for questions not yet answered. */
export function impliedAnswers(answers: LoggedAnswer[]): LoggedAnswer[] {
  const answered = new Set(answers.map((answer) => answer.questionId))
  const implied: LoggedAnswer[] = []
  for (const rule of IMPLICATIONS) {
    const [sourceId, sourceValue] = rule.source
    const [targetId, targetValue] = rule.implies
    if (answered.has(targetId)) continue
    if (implied.some((answer) => answer.questionId === targetId)) continue
    const hit = answers.some(
      (answer) =>
        !answer.skipped && answer.questionId === sourceId && answer.values.includes(sourceValue),
    )
    if (hit) implied.push({ questionId: targetId, values: [targetValue] })
  }
  return implied
}

/**
 * True when a logged value routes the need out of stamping — deep-drawn parts
 * (formed depth greater than width) are quoted by the Deep Drawing Services
 * family, so the remaining stamping questions no longer apply.
 */
export function routesOutToDeepDrawing(answers: LoggedAnswer[]): boolean {
  return answers.some((answer) => {
    if (answer.skipped) return false
    const question = questionById(answer.questionId)
    if (!question) return false
    return answer.values.some((value) =>
      question.options.some((option) => option.value === value && option.routesToDeepDrawing),
    )
  })
}

/**
 * Fold freshly parsed answers into the log, keeping only questions that have
 * not been answered yet — a buyer's later message never overwrites an explicit
 * earlier answer.
 */
export function mergeParsedAnswers(
  answers: LoggedAnswer[],
  parsed: LoggedAnswer[],
): { merged: LoggedAnswer[]; added: LoggedAnswer[] } {
  const answered = new Set(answers.map((answer) => answer.questionId))
  const added = parsed.filter((answer) => !answered.has(answer.questionId))
  return { merged: [...answers, ...added], added }
}

/**
 * Questions whose answers describe the order, not the supplier — a need-by
 * date or ship-to ZIP says nothing a profile can be screened on, and letting
 * its words filter ("ship" hitting "shipment") would empty the pool. They're
 * still asked and still go on the RFQ; they just don't narrow the list.
 */
const NON_FILTERING_QUESTIONS = new Set<string>(["delivery"])

/**
 * The suppliers still in play given everything logged so far. Answers within
 * one question widen (OR); answers across questions narrow (AND). Skipped
 * questions don't filter.
 */
export function candidatesFor(answers: LoggedAnswer[]): Supplier[] {
  let candidates = ALL_CANDIDATES
  for (const answer of answers) {
    if (answer.skipped || answer.values.length === 0) continue
    if (NON_FILTERING_QUESTIONS.has(answer.questionId)) continue
    candidates = narrowCandidates(candidates, answer.values)
  }
  return candidates
}

/**
 * A category this short can't be shopped from, so the run stops narrowing and
 * ends on the shortlist rather than asking a question that thins it further.
 */
export const MATCH_FLOOR = 10
/** How many suppliers the results rail is padded out to. */
export const BACKFILL_TARGET = 25

/**
 * The local database is a 104-profile slice of a 2,482-supplier category, so
 * screening it directly collapses after two answers where the real catalog
 * would still hold hundreds. The count the buyer sees is therefore modelled on
 * the whole category: each answer's selectivity — the share of the slice it
 * matches — is applied to the category total.
 *
 * The share is damped because capabilities correlate in a way a slice this
 * small can't show. Most stamping shops that run aluminum also run steel, so
 * multiplying raw selectivity across a dozen answers would annihilate a pool
 * that in reality narrows gently. The exponent is calibrated so a full run
 * lands near {@link MATCH_FLOOR} rather than at zero.
 */
const SELECTIVITY_DAMPING = 0.48
/** Bounds on one answer's effect, so no single pick ends or stalls the funnel. */
const MIN_STEP = 0.55
const MAX_STEP = 0.97

/** The share of the category one answer leaves behind. */
function answerStep(answer: LoggedAnswer): number {
  const matched = narrowCandidates(ALL_CANDIDATES, answer.values).length
  const selectivity = matched / ALL_CANDIDATES.length
  if (selectivity <= 0) return MIN_STEP
  return Math.min(MAX_STEP, Math.max(MIN_STEP, selectivity ** SELECTIVITY_DAMPING))
}

/**
 * Suppliers in the category still matching everything logged. This is the
 * number the buyer is shown and the one the run's floor is measured against —
 * the results rail below it is a page of that set, not the whole of it.
 */
export function simulatedMatchCount(answers: LoggedAnswer[]): number {
  let share = 1
  for (const answer of answers) {
    if (answer.skipped || answer.values.length === 0) continue
    if (NON_FILTERING_QUESTIONS.has(answer.questionId)) continue
    share *= answerStep(answer)
  }
  return Math.round(CATEGORY_SUPPLIER_COUNT * share)
}

export type MatchSet = {
  /** Suppliers in the slice meeting every answer logged. */
  matches: Supplier[]
  /**
   * Near matches padding the rail out to {@link BACKFILL_TARGET}, found by
   * relaxing the most recent answers. Empty while the slice can fill a page on
   * its own.
   */
  near: Supplier[]
  /** True once near matches were needed to fill the page. */
  backfilled: boolean
}

/**
 * Everything logged except the most recent answer that actually filters —
 * skipped questions and ones the profiles can't judge never narrowed anything,
 * so dropping them would widen nothing.
 */
function withoutLastFilter(answers: LoggedAnswer[]): LoggedAnswer[] {
  for (let index = answers.length - 1; index >= 0; index--) {
    const answer = answers[index]
    if (answer.skipped || answer.values.length === 0) continue
    if (NON_FILTERING_QUESTIONS.has(answer.questionId)) continue
    return [...answers.slice(0, index), ...answers.slice(index + 1)]
  }
  return answers
}

/**
 * How many profiles the rail shows for a given category count: a full page
 * while the category is larger than one, the category itself once it is
 * smaller, and a padded page once it drops under the floor — the run ends
 * there, and it ends on a shortlist worth working through rather than on the
 * handful that survived the last answer.
 */
export function railTarget(count: number): number {
  if (count < MATCH_FLOOR) return BACKFILL_TARGET
  return Math.min(count, BACKFILL_TARGET)
}

/**
 * A page of suppliers to put in front of the buyer. The slice is far smaller
 * than the category it stands for, so once it can't fill the page on its own
 * the most recent answers are relaxed one at a time until it can — an empty
 * rail under a header claiming hundreds would read as broken.
 */
export function matchSetFor(answers: LoggedAnswer[], target = BACKFILL_TARGET): MatchSet {
  const matches = candidatesFor(answers)
  if (matches.length >= target) {
    return { matches, near: [], backfilled: false }
  }
  const seen = new Set(matches.map((supplier) => supplier.id))
  const near: Supplier[] = []
  let widened = answers
  while (matches.length + near.length < target) {
    const relaxed = withoutLastFilter(widened)
    // Nothing left to relax — the slice simply holds no one else.
    if (relaxed.length === widened.length) break
    widened = relaxed
    for (const supplier of candidatesFor(widened)) {
      if (seen.has(supplier.id)) continue
      seen.add(supplier.id)
      near.push(supplier)
      if (matches.length + near.length >= target) break
    }
  }
  return { matches, near, backfilled: near.length > 0 }
}

export type NextAsk = {
  question: Question
  /** Option values still worth offering, pruned against who's left. */
  options: string[]
}

/**
 * The order the run asks in, set by the sourcing team's ask sequence rather
 * than by raw importance score. Questions outside it are never put to the
 * buyer — they're only logged when the buyer's own words cover them.
 *
 * "delivery" (Q7) holds its place in the order but has no questionnaire entry
 * yet, so it is skipped until one lands. Supplier location (Q9) is left out
 * entirely — the results rail filters on it, so asking for it would spend a
 * turn on something the buyer can narrow themselves.
 */
export const ASK_SEQUENCE = [
  "material",
  "tooling",
  "qty",
  "tol",
  "stock",
  "features",
  "process",
  "size",
  "app",
  "cert",
  "part",
  "delivery",
  "diverse",
]

/**
 * Denominator for the header's progress counter — only sequence entries the
 * questionnaire can actually ask, so the run never counts towards a question
 * the buyer will never see.
 */
export const ASK_COUNT = ASK_SEQUENCE.filter((questionId) => questionById(questionId)).length

/**
 * The next question worth asking: the first unanswered question in the ask
 * sequence whose options still lead somewhere. A need that routed out to Deep
 * Drawing asks nothing further.
 */
export function nextAsk(answers: LoggedAnswer[]): NextAsk | null {
  if (routesOutToDeepDrawing(answers)) return null
  const answered = new Set(answers.map((answer) => answer.questionId))
  // Options are pruned against the whole slice, not against what's left after
  // the answers so far. The slice stands for a category twenty times its size,
  // so a pool that has collapsed to one profile says nothing about whether the
  // category can still field an answer — reading it would cut the run short.
  const candidates = ALL_CANDIDATES
  for (const questionId of ASK_SEQUENCE) {
    if (answered.has(questionId)) continue
    const question = questionById(questionId)
    if (!question) continue
    const plan = planField(
      candidates,
      question.options.map((option) => option.value),
    )
    if (plan.skip) continue
    return { question, options: plan.options }
  }
  return null
}

/**
 * One line acknowledging what the opening message already told us, in the
 * order the questionnaire ranks the fields.
 */
export function introSummary(answers: LoggedAnswer[]): string {
  const parts: string[] = []
  for (const answer of answers) {
    const question = questionById(answer.questionId)
    if (!question || answer.values.length === 0) continue
    parts.push(`${question.title.toLowerCase()}: ${answer.values.join(", ")}`)
  }
  if (parts.length === 0) {
    return "The buyer is looking for stamping services. I'll start working through the details to build an accurate supplier match."
  }
  return `The buyer is looking for stamping services — ${parts.join("; ")}. I'll work through the remaining details to sharpen the supplier match.`
}
