import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UNLOCK_COOKIE, unlockStatus } from "@/lib/unlock";

/** Every request for the prototype passes the password gate first. */
export function proxy(request: NextRequest) {
  const status = unlockStatus(request.cookies.get(UNLOCK_COOKIE)?.value);

  if (status === "open") return NextResponse.next();

  if (status === "unconfigured") {
    return new NextResponse(
      "This deployment has no SITE_PASSWORD set, so there is no password to let anyone in with.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  // Rewritten rather than redirected so the address bar keeps the URL that was
  // shared — the link still reads as the prototype, not as a login page.
  const unlock = request.nextUrl.clone();
  unlock.pathname = "/unlock";
  unlock.search = "";
  return NextResponse.rewrite(unlock);
}

export const config = {
  // Everything except the gate itself, the route that clears it, and the
  // assets that page needs to render.
  matcher: ["/((?!unlock|api/unlock|_next/static|_next/image|favicon.ico|tailoft).*)"],
};
