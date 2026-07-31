import suppliersData from "./suppliers.json"

export type Supplier = {
  id: string
  name: string
  sponsored: boolean
  /** Verified marker (badge) on the supplier result. */
  verified?: boolean
  city: string
  state: string
  zip: string
  employees: string | null
  revenue: string | null
  founded: number | null
  companyTypes: string[]
  description: string
  capabilities: string[]
  certifications: string[]
  media: string[]
}

/**
 * Example supplier database for General Stamping Services (152408),
 * transcribed from supplier discovery search result pages.
 */
export const SUPPLIERS = suppliersData as Supplier[]

/**
 * Total suppliers in the Stamping Services category — the "out of" number for
 * match counts. (The local database holds a transcribed sample.)
 */
export const CATEGORY_SUPPLIER_COUNT = 2482
export const CATEGORY_LABEL = "Stamping Services"

/**
 * A count over the local sample, restated against the whole category — each
 * profile here stands for its share of the 2,482. Counts shown to the buyer go
 * through this, so the ask blocks and the supplier panel speak in the same
 * numbers.
 */
export function scaleToCategory(count: number): number {
  return Math.round((count * CATEGORY_SUPPLIER_COUNT) / SUPPLIERS.length)
}
