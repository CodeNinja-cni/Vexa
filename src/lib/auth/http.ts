import type { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

function configuredOrigin(request: NextRequest): string {
  const configured = process.env.VEXA_APP_URL;
  if (!configured) return request.nextUrl.origin;
  try {
    return new URL(configured).origin;
  } catch {
    return request.nextUrl.origin;
  }
}

export function hasTrustedMutationOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === request.nextUrl.origin || origin === configuredOrigin(request);
}

export function setSessionCookie(
  response: NextResponse,
  request: NextRequest,
  session: { token: string; expiresAt: Date },
): void {
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: configuredOrigin(request).startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: session.expiresAt,
    priority: "high",
  });
}

export function clearSessionCookie(
  response: NextResponse,
  request: NextRequest,
): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: configuredOrigin(request).startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    priority: "high",
  });
}
