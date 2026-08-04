import { QUESTIONNAIRE } from "./questionnaire"
import {
  LOCATION_NATIONAL,
  LOCATION_QUESTION_ID,
  questionById,
  type LoggedAnswer,
} from "./simulation"

/**
 * Bridge between the All Filters drawer and the agent questionnaire.
 * Only facets that map to a real question sync; company type / verified /
 * partner stay local to the results rail.
 */

/** Drawer group id → questionnaire question id when values align 1:1. */
export const FACET_QUESTION_IDS: Record<string, string> = {
  material: "material",
  certification: "cert",
}

/** Aliases from supplier-profile wording → questionnaire option values. */
const CERT_ALIASES: Record<string, { questionId: string; value: string }> = {
  "Woman-owned": { questionId: "diverse", value: "Woman Owned" },
  "Woman Owned": { questionId: "diverse", value: "Woman Owned" },
  HUBZone: { questionId: "diverse", value: "HubZone" },
  HubZone: { questionId: "diverse", value: "HubZone" },
}

function optionValues(questionId: string): string[] {
  return questionById(questionId)?.options.map((option) => option.value) ?? []
}

/**
 * Map a supplier capability label onto questionnaire material option(s).
 * Longer names win so "Stainless Steel Stampings" → Stainless Steel, not Steel.
 */
export function materialsForCapability(capability: string): string[] {
  const lower = capability.toLowerCase()
  const materials = [...optionValues("material")].sort((a, b) => b.length - a.length)
  const hits = materials.filter((material) => lower.includes(material.toLowerCase()))
  return hits.filter(
    (material, _index, all) =>
      !all.some(
        (other) =>
          other !== material &&
          other.length > material.length &&
          other.toLowerCase().includes(material.toLowerCase()),
      ),
  )
}

/** Questionnaire materials currently represented by checked capability labels. */
export function materialsFromCapabilities(capabilities: string[]): string[] {
  const values = new Set<string>()
  for (const capability of capabilities) {
    for (const material of materialsForCapability(capability)) values.add(material)
  }
  return [...values]
}

/** Capability checkboxes that should appear selected for logged material answers. */
export function capabilitiesForMaterials(
  materials: string[],
  capabilityOptions: string[],
): string[] {
  if (materials.length === 0) return []
  const wanted = new Set(materials.map((value) => value.toLowerCase()))
  return capabilityOptions.filter((capability) =>
    materialsForCapability(capability).some((material) => wanted.has(material.toLowerCase())),
  )
}

/** Resolve a drawer certification checkbox to a questionnaire answer, if any. */
export function mapCertificationOption(
  option: string,
): { questionId: string; value: string } | null {
  const alias = CERT_ALIASES[option]
  if (alias) return alias
  if (optionValues("cert").includes(option)) return { questionId: "cert", value: option }
  if (optionValues("diverse").includes(option)) return { questionId: "diverse", value: option }
  // Case-insensitive fallback against both lists.
  const lower = option.toLowerCase()
  for (const questionId of ["cert", "diverse"] as const) {
    const match = optionValues(questionId).find((value) => value.toLowerCase() === lower)
    if (match) return { questionId, value: match }
  }
  return null
}

/** Certification checkboxes that should appear selected for logged cert/diverse answers. */
export function certificationsForAnswers(
  answers: LoggedAnswer[],
  certificationOptions: string[],
): string[] {
  const wanted = new Set<string>()
  for (const answer of answers) {
    if (answer.skipped || (answer.questionId !== "cert" && answer.questionId !== "diverse")) {
      continue
    }
    for (const value of answer.values) wanted.add(value.toLowerCase())
  }
  if (wanted.size === 0) return []
  return certificationOptions.filter((option) => {
    const mapped = mapCertificationOption(option)
    return mapped != null && wanted.has(mapped.value.toLowerCase())
  })
}

/** Location field text for the drawer, derived from the loc answer when present. */
export function locationFromAnswers(answers: LoggedAnswer[]): string | null {
  const answer = answers.find(
    (entry) => entry.questionId === LOCATION_QUESTION_ID && !entry.skipped && entry.values.length > 0,
  )
  if (!answer) return null
  if (answer.values.includes(LOCATION_NATIONAL)) return ""
  return answer.values[0] ?? ""
}

/** Question ids the drawer can write back into the agent rail. */
export function syncableQuestionIds(): string[] {
  const ids = new Set<string>(Object.values(FACET_QUESTION_IDS))
  ids.add(LOCATION_QUESTION_ID)
  ids.add("diverse")
  // Only keep ids that exist in the questionnaire.
  return [...ids].filter((id) => QUESTIONNAIRE.some((question) => question.id === id))
}
