import { NextResponse, type NextRequest } from "next/server";

import { getGoogleOAuthConfig } from "@/lib/auth/config";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  validateOAuthState,
} from "@/lib/auth/oauth-state";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUser,
  provisionGoogleAccount,
} from "@/lib/connectors/google/oauth";

function errorRedirect(appUrl: string, code: string): NextResponse {
  const url = new URL("/login", appUrl);
  url.searchParams.set("authError", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  let config;
  try {
    config = getGoogleOAuthConfig();
  } catch {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });
  }

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return errorRedirect(config.appUrl, providerError);

  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !stateCookie) {
    return errorRedirect(config.appUrl, "missing_oauth_response");
  }

  try {
    const state = validateOAuthState(
      stateCookie,
      returnedState,
      config.authSecret,
    );
    const credential = await exchangeGoogleAuthorizationCode(
      code,
      state.verifier,
      config,
    );
    const googleUser = await fetchGoogleUser(credential.accessToken);
    const account = await provisionGoogleAccount(
      googleUser,
      credential,
      config.authSecret,
    );
    const session = await createSession(account.organizationId, account.userId);
    const destination = new URL(state.returnTo, config.appUrl);
    destination.searchParams.set("connected", "google");

    const response = NextResponse.redirect(destination);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: session.expiresAt,
      priority: "high",
    });
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return errorRedirect(config.appUrl, "google_connection_failed");
  }
}
