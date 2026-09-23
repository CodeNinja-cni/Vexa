import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie, hasTrustedMutationOrigin } from "@/lib/auth/http";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, request);
  return response;
}
