import { ALL_CANDIDATES, narrowCandidates, planField } from "./ask-viability"
import { QUESTIONNAIRE, type Question } from "./questionnaire"
import type { Supplier } from "./suppliers"

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
 * its words filter ("ship" hitting "shipment") would empty the pool.
 */
const NON_FILTERING_QUESTIONS = new Set<string>()

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

export type NextAsk = {
  question: Question
  /** Option values still worth offering, pruned against who's left. */
  options: string[]
}

/**
 * The next question worth asking: highest-importance unanswered core question
 * whose options still lead somewhere. Only "required core" questions (Q1–Q7)
 * are ever put to the buyer — adaptive ones are logged only when the buyer's
 * own words cover them. A need that routed out to Deep Drawing asks nothing
 * further.
 */
const CORE_QUESTION_IDS = new Set(
  QUESTIONNAIRE.filter((question) => question.tier === "core").map((question) => question.id),
)

/** Denominator for the header's progress counter. */
export const CORE_QUESTION_COUNT = CORE_QUESTION_IDS.size

/**
 * Core questions settled so far, however they were settled: answered, skipped,
 * or covered by something the buyer already said.
 */
export function coreAnswered(answers: LoggedAnswer[]): number {
  const settled = new Set(
    answers
      .map((answer) => answer.questionId)
      .filter((questionId) => CORE_QUESTION_IDS.has(questionId)),
  )
  return settled.size
}

export function nextAsk(answers: LoggedAnswer[]): NextAsk | null {
  if (routesOutToDeepDrawing(answers)) return null
  const answered = new Set(answers.map((answer) => answer.questionId))
  const candidates = candidatesFor(answers)
  for (const question of QUESTIONNAIRE) {
    if (question.tier !== "core") continue
    if (answered.has(question.id)) continue
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
