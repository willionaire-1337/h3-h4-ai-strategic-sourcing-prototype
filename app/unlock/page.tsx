import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password required — Strategic Sourcing",
};

type UnlockPageProps = {
  searchParams: Promise<{ error?: string }>;
};

/**
 * The password gate. A plain form post so the page needs no client JavaScript
 * — it renders and submits even though the proxy is holding back the rest of
 * the app's assets.
 */
export default async function UnlockPage({ searchParams }: UnlockPageProps) {
  const { error } = await searchParams;

  return (
    <main className="unlock-shell">
      <form className="unlock-card" method="post" action="/api/unlock">
        <l-icon name="shield-check" class="unlock-icon" aria-hidden="true" />
        <h1 className="unlock-title mar-0">Strategic Sourcing prototype</h1>
        <p className="unlock-sub mar-0">
          This preview is password protected. Enter the password you were sent to continue.
        </p>
        <label className="unlock-field">
          <span className="unlock-label">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        {error && (
          <p className="unlock-error mar-0" role="alert">
            <l-icon name="circle-exclamation" aria-hidden="true" />
            That password didn&apos;t match. Try again.
          </p>
        )}
        <button kind="primary" type="submit">
          Continue
        </button>
      </form>
    </main>
  );
}
