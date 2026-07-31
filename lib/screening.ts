import { SUPPLIERS, type Supplier } from "./suppliers"

/**
 * Screening the supplier database against what the buyer typed. This is the
 * filter behind the live "N matching / N ruled out" counter and the candidates
 * that fill the supplier panel while Thomas AI works — so it has to reach the
 * same verdicts a buyer would: a metro means its region, a material or
 * certification means the profiles that carry it.
 */

/** Profiles carry two-letter states; buyers write them out, or say a metro. */
const STATE_CODES: Record<string, string> = Object.fromEntries(
  (
    "alabama:al,alaska:ak,arizona:az,arkansas:ar,california:ca,colorado:co," +
    "connecticut:ct,delaware:de,florida:fl,georgia:ga,hawaii:hi,idaho:id," +
    "illinois:il,indiana:in,iowa:ia,kansas:ks,kentucky:ky,louisiana:la," +
    "maine:me,maryland:md,massachusetts:ma,michigan:mi,minnesota:mn," +
    "mississippi:ms,missouri:mo,montana:mt,nebraska:ne,nevada:nv," +
    "new hampshire:nh,new jersey:nj,new mexico:nm,new york:ny," +
    "north carolina:nc,north dakota:nd,ohio:oh,oklahoma:ok,oregon:or," +
    "pennsylvania:pa,rhode island:ri,south carolina:sc,south dakota:sd," +
    "tennessee:tn,texas:tx,utah:ut,vermont:vt,virginia:va,washington:wa," +
    "west virginia:wv,wisconsin:wi,wyoming:wy,ontario:on,quebec:qc"
  )
    .split(",")
    .map((entry) => entry.split(":")),
)

/** Metros a buyer sources "near", resolved to the state they sit in. */
const METRO_STATES: Record<string, string> = Object.fromEntries(
  (
    "boston:ma,worcester:ma,springfield:ma,providence:ri,hartford:ct," +
    "new haven:ct,bridgeport:ct,new york:ny,brooklyn:ny,buffalo:ny," +
    "rochester:ny,syracuse:ny,albany:ny,newark:nj,philadelphia:pa," +
    "pittsburgh:pa,baltimore:md,washington:dc,richmond:va,charlotte:nc," +
    "raleigh:nc,atlanta:ga,orlando:fl,tampa:fl,miami:fl,nashville:tn," +
    "memphis:tn,louisville:ky,cincinnati:oh,columbus:oh,cleveland:oh," +
    "toledo:oh,detroit:mi,grand rapids:mi,indianapolis:in,chicago:il," +
    "rockford:il,milwaukee:wi,madison:wi,minneapolis:mn,st. paul:mn," +
    "des moines:ia,st. louis:mo,kansas city:mo,omaha:ne,oklahoma city:ok," +
    "tulsa:ok,dallas:tx,fort worth:tx,houston:tx,austin:tx,san antonio:tx," +
    "denver:co,salt lake city:ut,phoenix:az,las vegas:nv,albuquerque:nm," +
    "los angeles:ca,san diego:ca,san jose:ca,san francisco:ca," +
    "sacramento:ca,portland:or,seattle:wa,toronto:on,montreal:qc"
  )
    .split(",")
    .map((entry) => entry.split(":")),
)

/**
 * Bordering states. Sourcing is regional — a Boston buyer takes a Connecticut
 * or Rhode Island shop within driving distance — so a named state pulls in its
 * neighbors as weaker, still-valid matches.
 */
const STATE_NEIGHBORS: Record<string, string[]> = Object.fromEntries(
  (
    "al:fl ga ms tn|az:ca nm nv ut|ar:la mo ms ok tn tx|ca:az nv or|" +
    "co:az ks ne nm ok ut wy|ct:ma ny ri|de:md nj pa|fl:al ga|" +
    "ga:al fl nc sc tn|ia:il mn mo ne sd wi|id:mt nv or ut wa wy|" +
    "il:ia in ky mo wi|in:il ky mi oh|ks:co mo ne ok|" +
    "ky:il in mo oh tn va wv|la:ar ms tx|ma:ct nh ny ri vt|" +
    "md:de pa va wv|me:nh|mi:in oh wi on|mn:ia nd sd wi on|" +
    "mo:ar ia il ks ky ne ok tn|ms:al ar la tn|mt:id nd sd wy|" +
    "nc:ga sc tn va|nd:mn mt sd|ne:co ia ks mo sd wy|nh:ma me vt|" +
    "nj:de ny pa|nm:az co ok tx|nv:az ca id or ut|ny:ct ma nj pa vt on|" +
    "oh:in ky mi pa wv|ok:ar co ks mo nm tx|or:ca id nv wa|" +
    "pa:de md nj ny oh wv|ri:ct ma|sc:ga nc|sd:ia mn mt nd ne wy|" +
    "tn:al ar ga ky mo ms nc va|tx:ar la nm ok|ut:az co id nm nv wy|" +
    "va:ky md nc tn wv|vt:ma nh ny qc|wa:id or|wi:ia il mi mn|" +
    "wv:ky md oh pa va|wy:co id mt ne sd ut|on:mi mn ny qc|qc:ny vt on"
  )
    .split("|")
    .map((entry) => {
      const [state, neighbors] = entry.split(":")
      return [state, neighbors.split(" ")]
    }),
)

/**
 * State codes that are also ordinary words — "shops in Ohio" is not Indiana,
 * "or" is not Oregon. These only count as states when the buyer capitalizes
 * them the way an address does.
 */
const AMBIGUOUS_CODES = new Set(["de", "hi", "id", "in", "la", "me", "ok", "on", "or"])

/** Words that describe the ask, not the supplier. */
const STOP_WORDS = new Set([
  "and",
  "any",
  "are",
  "around",
  "can",
  "closest",
  "company",
  "companies",
  "could",
  "does",
  "find",
  "for",
  "from",
  "get",
  "give",
  "have",
  "hold",
  "how",
  "including",
  "inside",
  "look",
  "looking",
  "make",
  "manufacturer",
  "manufacturers",
  "near",
  "nearby",
  "need",
  "shop",
  "shops",
  "show",
  "stamping",
  "stampings",
  "supplier",
  "suppliers",
  "that",
  "the",
  "them",
  "vendor",
  "vendors",
  "want",
  "who",
  "with",
  "within",
])

/** Everything about a profile a screening pass can read. */
const RECORD_TEXT = new Map<string, string>()
export function recordText(record: Supplier): string {
  const cached = RECORD_TEXT.get(record.id)
  if (cached) return cached
  const text = [
    record.name,
    record.city,
    record.state,
    record.description,
    record.companyTypes.join(" "),
    record.capabilities.join(" "),
    record.certifications.join(" "),
  ]
    .join(" ")
    .toLowerCase()
  RECORD_TEXT.set(record.id, text)
  return text
}

/**
 * A test for one of the buyer's words against profile text. Short terms match
 * on word boundaries, or a state like "MA" would hit "manufacturing".
 */
function termMatcher(term: string): (text: string) => boolean {
  if (term.length > 3) return (text) => text.includes(term)
  const escaped = term.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&")
  const pattern = new RegExp(`\\b${escaped}\\b`)
  return (text) => pattern.test(text)
}

export type ScreenPlan = {
  /** Capability words some profile in the database actually carries. */
  terms: ((text: string) => boolean)[]
  /** States the buyer named, directly or through a metro. */
  states: Set<string>
  /** States bordering those — regional, still worth showing. */
  nearby: Set<string>
}

/** What to screen for, read off the buyer's own words. */
export function planScreening(query: string, criteria: string[]): ScreenPlan {
  const raw = `${criteria.join(" ")} ${query}`
  const text = raw.toLowerCase()

  // Geography first, and pulled out of the word list: "boston" screens as a
  // region, not as a word to find in a profile (no profile says "Boston").
  const states = new Set<string>()
  const geoWords = new Set<string>()
  const codes = new Set(Object.values(STATE_CODES))
  for (const [name, code] of [
    ...Object.entries(STATE_CODES),
    ...Object.entries(METRO_STATES),
  ]) {
    if (!new RegExp(`\\b${name}\\b`).test(text)) continue
    states.add(code)
    name.split(" ").forEach((word) => geoWords.add(word))
  }
  for (const match of text.match(/\b[a-z]{2}\b/g) ?? []) {
    if (!codes.has(match)) continue
    const spelled =
      !AMBIGUOUS_CODES.has(match) ||
      new RegExp(`\\b${match.toUpperCase()}\\b`).test(raw)
    if (spelled) states.add(match)
  }
  const nearby = new Set<string>()
  for (const state of states) {
    for (const neighbor of STATE_NEIGHBORS[state] ?? []) {
      if (!states.has(neighbor)) nearby.add(neighbor)
    }
  }

  const words = [
    ...new Set(
      (text.match(/[a-z0-9±./-]{3,}/g) ?? [])
        .filter((word) => !STOP_WORDS.has(word) && !geoWords.has(word))
        // Profiles say "tolerance", buyers say "tolerances" — match the stem.
        .map((word) => word.replace(/s$/, "")),
    ),
  ].slice(0, 12)

  // A word no profile in the database carries can't filter anything; keeping
  // it would rule out every supplier and leave the counter stuck at zero.
  const terms = words
    .map(termMatcher)
    .filter((test) => SUPPLIERS.some((record) => test(recordText(record))))

  return { terms, states, nearby }
}

/**
 * How well a profile answers the ask: 0 rules it out. Geography is a gate — a
 * shop outside the region is out regardless of capability — and past that,
 * profiles score on how many of the buyer's words they carry.
 */
export function scoreRecord(record: Supplier, plan: ScreenPlan): number {
  const inRegion =
    plan.states.size === 0 ||
    plan.states.has(record.state.toLowerCase()) ||
    plan.nearby.has(record.state.toLowerCase())
  if (!inRegion) return 0

  const text = recordText(record)
  const hits = plan.terms.filter((test) => test(text)).length
  if (plan.terms.length > 0) {
    // With a region already narrowing the field one capability word is enough;
    // without one, a single generic word ("aluminum") isn't a match.
    const needed = plan.states.size > 0 ? 1 : Math.min(2, plan.terms.length)
    if (hits < needed) return 0
  } else if (plan.states.size === 0 && !record.verified) {
    // Nothing to screen on yet — lead with the profiles Thomas has verified.
    return 0
  }

  const local = plan.states.has(record.state.toLowerCase()) ? 2 : 0
  return 1 + hits + local
}

/** Every profile that clears the screen for this search, verdict complete. */
export function screenedRecords(query: string, criteria: string[]): Supplier[] {
  if (!query.trim() && criteria.length === 0) return []
  const plan = planScreening(query, criteria)
  return SUPPLIERS.filter((record) => scoreRecord(record, plan) > 0)
}

/**
 * The order to read the database in, and the verdict for each profile. Matches
 * and rejections are interleaved in proportion so both counters climb from the
 * first profile, and the strongest matches surface first so the panel fills
 * with the best candidates rather than whatever happens to sort early.
 */
export function screeningPass(
  query: string,
  criteria: string[],
): { order: number[]; scores: number[] } {
  const plan = planScreening(query, criteria)
  const scores = SUPPLIERS.map((record) => scoreRecord(record, plan))
  const kept = scores
    .map((score, index) => ({ score, index }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.index)
  const dropped = scores
    .map((_, index) => index)
    .filter((index) => scores[index] === 0)

  const order: number[] = []
  let k = 0
  let d = 0
  while (k < kept.length || d < dropped.length) {
    const takeKept =
      d >= dropped.length ||
      (k < kept.length && k * dropped.length <= d * kept.length)
    order.push(takeKept ? kept[k++] : dropped[d++])
  }
  return { order, scores }
}
