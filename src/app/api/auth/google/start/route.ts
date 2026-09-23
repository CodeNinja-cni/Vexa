import { NextResponse, type NextRequest } from "next/server";

import { getGoogleOAuthConfig } from "@/lib/auth/config";
import {
  createOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
  normalizeReturnTo,
} from "@/lib/auth/oauth-state";
import { GOOGLE_SCOPES } from "@/lib/connectors/google/oauth";

export function GET(request: NextRequest) {
  try {
    const config = getGoogleOAuthConfig();
    const returnTo = normalizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
    const authorization = createOAuthState(config.authSecret, returnTo);
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    authorizationUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
      state: authorization.state.state,
      code_challenge: authorization.codeChallenge,
      code_challenge_method: "S256",
    }).toString();

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, authorization.cookieValue, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS,
      priority: "high",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth is unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
