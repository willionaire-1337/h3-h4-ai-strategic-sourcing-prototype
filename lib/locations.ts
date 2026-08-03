import { STATE_CODES } from "./screening"
import { SUPPLIERS } from "./suppliers"

/**
 * Autocomplete behind the location question's input. Suggestions are drawn
 * from the state list and the supplier database's own cities and ZIPs, so
 * every row offered provably leads to suppliers rather than to an empty rail.
 */

export type LocationSuggestion = {
  /** What the row shows. */
  label: string
  /** What gets logged as the answer when the row is picked. */
  value: string
  kind: "State" | "City" | "ZIP"
}

function titleCase(name: string): string {
  return name.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

const STATES: LocationSuggestion[] = Object.keys(STATE_CODES).map((name) => ({
  label: titleCase(name),
  value: titleCase(name),
  kind: "State",
}))

/** State codes alongside, so "tx" can suggest Texas. */
const STATE_BY_CODE = new Map(Object.entries(STATE_CODES).map(([name, code]) => [code, name]))

const CITIES: LocationSuggestion[] = [
  ...new Map(
    SUPPLIERS.map((supplier) => [
      `${supplier.city}, ${supplier.state}`.toLowerCase(),
      { label: `${supplier.city}, ${supplier.state}`, value: `${supplier.city}, ${supplier.state}`, kind: "City" as const },
    ]),
  ).values(),
].sort((a, b) => a.label.localeCompare(b.label))

const ZIPS: LocationSuggestion[] = [
  ...new Map(
    SUPPLIERS.map((supplier) => [
      supplier.zip,
      {
        label: `${supplier.zip} · ${supplier.city}, ${supplier.state}`,
        value: supplier.zip,
        kind: "ZIP" as const,
      },
    ]),
  ).values(),
].sort((a, b) => a.value.localeCompare(b.value))

/**
 * The rows worth offering for what's been typed so far: digits complete
 * against supplier ZIPs; anything else against state names (or their
 * two-letter codes) and supplier cities, states first.
 */
export function locationSuggestions(query: string, limit = 6): LocationSuggestion[] {
  const text = query.trim().toLowerCase()
  if (!text) return []

  if (/^\d/.test(text)) {
    if (!/^\d+$/.test(text)) return []
    return ZIPS.filter((entry) => entry.value.startsWith(text)).slice(0, limit)
  }

  const stateName = text.length === 2 ? STATE_BY_CODE.get(text) : undefined
  const states = STATES.filter(
    (entry) =>
      entry.label.toLowerCase().startsWith(text) ||
      (stateName !== undefined && entry.label.toLowerCase() === stateName),
  )
  const cities = CITIES.filter((entry) => entry.label.toLowerCase().startsWith(text))
  return [...states, ...cities].slice(0, limit)
}
