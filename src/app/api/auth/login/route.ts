import { NextResponse, type NextRequest } from "next/server";

import {
  authenticateCredentials,
  CredentialAuthError,
  loginSchema,
} from "@/lib/auth/credentials";
import { hasTrustedMutationOrigin, setSessionCookie } from "@/lib/auth/http";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Untrusted request origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter your login details." },
      { status: 400 },
    );
  }

  try {
    const account = await authenticateCredentials(parsed.data);
    const session = await createSession(account.organizationId, account.userId);
    const response = NextResponse.json({ ok: true, redirectTo: "/app" });
    setSessionCookie(response, request, session);
    return response;
  } catch (error) {
    if (error instanceof CredentialAuthError) {
      return NextResponse.json(
        { error: "The email or password is incorrect." },
        { status: 401 },
      );
    }
    console.error("Credential login failed", error);
    return NextResponse.json(
      { error: "Account storage is temporarily unavailable. Start PostgreSQL or configure DATABASE_URL." },
      { status: 503 },
    );
  }
}
