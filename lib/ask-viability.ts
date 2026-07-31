import { planScreening, recordText } from "./screening"
import { SUPPLIERS, type Supplier } from "./suppliers"

/**
 * Whether a question is still worth asking, read off the supplier data. An ask
 * exists to narrow the field, so an answer nobody can fulfil is a dead end and
 * a question whose every answer is a dead end shouldn't be put to the buyer at
 * all. The database only gets a say where it has one: asks about timelines or
 * budgets mean nothing to a supplier profile, and those go through untouched.
 */

/**
 * A test for one answer against a profile. Null when no profile speaks to it,
 * which is how a qualitative answer ("Within 4 weeks") is told apart from one
 * the data can judge ("Aluminum"). Any of the answer's words counts as a hit —
 * an option like "Brass, bronze & copper" describes alternatives, not a set of
 * requirements to meet all at once.
 */
/**
 * Buyers say "fineblanking"; profiles say "fineblanked". Trimming the verb
 * ending gives the two a chance to meet. Only used as a fallback, and only ever
 * widens what counts as a match — the safe direction for a rule that hides
 * questions.
 */
function stem(answer: string): string {
  return answer.replace(/\b([a-z]{5,}?)(ing|ed)\b/gi, "$1")
}

function answerTest(answer: string): ((record: Supplier) => boolean) | null {
  let plan = planScreening(answer, [])
  if (plan.states.size === 0 && plan.terms.length === 0) {
    const stemmed = stem(answer)
    if (stemmed !== answer) plan = planScreening(stemmed, [])
  }
  // A place is answered by being in the region. Reading the rest of the words
  // too would rule out every shop in Boston that doesn't say "area".
  if (plan.states.size > 0) {
    return (record) => {
      const state = record.state.toLowerCase()
      return plan.states.has(state) || plan.nearby.has(state)
    }
  }
  if (plan.terms.length === 0) return null
  return (record) => {
    const text = recordText(record)
    return plan.terms.some((test) => test(text))
  }
}

/**
 * The suppliers still in play after an answer. Several answers to one question
 * widen rather than narrow — picking aluminum and steel means either.
 */
export function narrowCandidates(
  records: Supplier[],
  answers: string[],
): Supplier[] {
  const tests = answers
    .map(answerTest)
    .filter((test): test is (record: Supplier) => boolean => test !== null)
  if (tests.length === 0) return records
  return records.filter((record) => tests.some((test) => test(record)))
}

export type FieldPlan = {
  /** Don't put this question to the buyer — no answer leads anywhere. */
  skip: boolean
  /** The answers still worth offering, in the model's order. */
  options: string[]
}

/** Everything, for the first question in a block. */
export const ALL_CANDIDATES: Supplier[] = SUPPLIERS

/**
 * What to do with a question given who's left. Options the data can't judge are
 * always kept — the buyer knows things the profiles don't.
 */
export function planField(
  candidates: Supplier[],
  options: string[],
): FieldPlan {
  // No one is left to narrow — every further question is moot.
  if (candidates.length === 0) return { skip: true, options: [] }

  const scored = options.map((option) => {
    const test = answerTest(option)
    return {
      option,
      count: test === null ? null : candidates.filter(test).length,
    }
  })

  // The data only gets a say where it speaks to the question as a whole. One
  // incidental word hit among five options ("Flexible" turning up in a profile)
  // is not the data understanding a question about timelines.
  const judged = scored.filter((entry) => entry.count !== null)
  if (judged.length < 2 || judged.length * 2 < options.length) {
    return { skip: false, options }
  }

  const kept = scored.filter((entry) => entry.count !== 0)
  const leadsSomewhere = judged.some((entry) => entry.count! > 0)
  // Skip when nothing the data can vouch for survives, and when only one answer
  // is left — a question with one answer isn't a question.
  return {
    skip: !leadsSomewhere || kept.length < 2,
    options: kept.map((entry) => entry.option),
  }
}
