import { NextResponse, type NextRequest } from "next/server";

import {
  deleteSession,
  getRequestPrincipal,
  SESSION_COOKIE,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const principal = await getRequestPrincipal(request);

  return NextResponse.json(
    principal
      ? {
          authenticated: true,
          user: {
            email: principal.email,
            displayName: principal.displayName,
            organizationName: principal.organizationName,
          },
        }
      : { authenticated: false, user: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);

  const response = NextResponse.json({ authenticated: false });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
