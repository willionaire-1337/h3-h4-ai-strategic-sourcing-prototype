import { createHash, timingSafeEqual } from "node:crypto"

/**
 * The password gate in front of the shared prototype. Vercel's own password
 * protection is a Pro-plan feature and this deploy is on Hobby, so the check
 * lives in the app: `proxy.ts` blocks every request without a valid cookie,
 * and `/api/unlock` issues one in exchange for the password.
 */

export const UNLOCK_COOKIE = "sourcing-unlock"

/** How long one unlock lasts before the password is asked for again. */
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 30

/**
 * The cookie carries a hash rather than the password itself, so the password
 * never sits in a browser jar and a copied cookie grants no more than the
 * password already shared with the team does.
 */
function token(password: string): string {
  return createHash("sha256").update(`sourcing-unlock:${password}`).digest("hex")
}

function sameToken(given: string, expected: string): boolean {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * The cookie value to hand back for a correct password, or null when it
 * doesn't match — also null when no password is configured, so a misconfigured
 * deploy can't be unlocked by guessing the empty string.
 */
export function unlockToken(submitted: string): string | null {
  const password = process.env.SITE_PASSWORD
  if (!password) return null
  return sameToken(token(submitted), token(password)) ? token(password) : null
}

export type UnlockStatus =
  /** Cleared the gate, or no gate is in force. */
  | "open"
  /** Needs the password. */
  | "locked"
  /** Deployed without SITE_PASSWORD, so there's no password to check against. */
  | "unconfigured"

/**
 * Whether a request carrying `cookie` may through. Without SITE_PASSWORD the
 * gate stands down in development so `next dev` needs no setup, but a
 * production deploy missing it closes rather than quietly serving to everyone.
 */
export function unlockStatus(cookie: string | undefined): UnlockStatus {
  const password = process.env.SITE_PASSWORD
  if (!password) {
    return process.env.NODE_ENV === "production" ? "unconfigured" : "open"
  }
  if (!cookie) return "locked"
  return sameToken(cookie, token(password)) ? "open" : "locked"
}
