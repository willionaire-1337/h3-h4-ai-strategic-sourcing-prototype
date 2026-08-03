import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UNLOCK_COOKIE, UNLOCK_MAX_AGE, unlockToken } from "@/lib/unlock";

/** Trades the password for the cookie the proxy checks on every request. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = unlockToken(String(form.get("password") ?? ""));

  // 303 so the browser follows with a GET and a refresh doesn't re-post.
  if (!token) {
    return NextResponse.redirect(new URL("/unlock?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set({
    name: UNLOCK_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
  return response;
}
