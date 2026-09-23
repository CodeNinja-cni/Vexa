import { NextResponse, type NextRequest } from "next/server";

import {
  CredentialAuthError,
  provisionCredentialAccount,
  signupSchema,
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
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the highlighted account details." },
      { status: 400 },
    );
  }

  try {
    const account = await provisionCredentialAccount(parsed.data);
    const session = await createSession(account.organizationId, account.userId);
    const response = NextResponse.json(
      { ok: true, redirectTo: "/app" },
      { status: 201 },
    );
    setSessionCookie(response, request, session);
    return response;
  } catch (error) {
    if (error instanceof CredentialAuthError && error.code === "account_exists") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Credential registration failed", error);
    return NextResponse.json(
      { error: "Account storage is temporarily unavailable. Start PostgreSQL or configure DATABASE_URL." },
      { status: 503 },
    );
  }
}
