import { createHash } from "node:crypto";
import { z } from "zod";

import {
  generateOpaqueToken,
  openJson,
  sealJson,
  secureEqual,
} from "@/lib/security/crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "vexa_google_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

const oauthStateSchema = z.object({
  state: z.string().min(32),
  verifier: z.string().min(43),
  returnTo: z.string().startsWith("/"),
  expiresAt: z.number().int().positive(),
});

export type OAuthState = z.infer<typeof oauthStateSchema>;

export function normalizeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function createOAuthState(
  secret: string,
  returnTo: string,
  now = Date.now(),
): { state: OAuthState; cookieValue: string; codeChallenge: string } {
  const state: OAuthState = {
    state: generateOpaqueToken(32),
    verifier: generateOpaqueToken(48),
    returnTo: normalizeReturnTo(returnTo),
    expiresAt: now + GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS * 1000,
  };

  const codeChallenge = createHash("sha256")
    .update(state.verifier, "utf8")
    .digest("base64url");

  return {
    state,
    cookieValue: sealJson(state, secret, "google-oauth-state"),
    codeChallenge,
  };
}

export function validateOAuthState(
  cookieValue: string,
  returnedState: string,
  secret: string,
  now = Date.now(),
): OAuthState {
  const parsed = oauthStateSchema.parse(
    openJson<unknown>(cookieValue, secret, "google-oauth-state"),
  );

  if (parsed.expiresAt <= now) {
    throw new Error("The Google authorization request has expired.");
  }

  if (!secureEqual(parsed.state, returnedState)) {
    throw new Error("The Google authorization state did not match.");
  }

  return parsed;
}
