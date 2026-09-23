import { describe, expect, it } from "vitest";

import {
  createOAuthState,
  normalizeReturnTo,
  validateOAuthState,
} from "@/lib/auth/oauth-state";

const secret = "test-secret-with-at-least-thirty-two-characters";

describe("Google OAuth state", () => {
  it("round-trips a valid state and PKCE verifier", () => {
    const created = createOAuthState(secret, "/?connected=google", 1_000);
    const validated = validateOAuthState(
      created.cookieValue,
      created.state.state,
      secret,
      2_000,
    );

    expect(validated.returnTo).toBe("/?connected=google");
    expect(validated.verifier.length).toBeGreaterThanOrEqual(43);
    expect(created.codeChallenge).toHaveLength(43);
  });

  it("rejects mismatched or expired state", () => {
    const created = createOAuthState(secret, "/", 1_000);

    expect(() =>
      validateOAuthState(created.cookieValue, "wrong-state", secret, 2_000),
    ).toThrow();
    expect(() =>
      validateOAuthState(
        created.cookieValue,
        created.state.state,
        secret,
        1_000 + 11 * 60 * 1000,
      ),
    ).toThrow(/expired/);
  });

  it("prevents external return redirects", () => {
    expect(normalizeReturnTo("https://attacker.example")).toBe("/");
    expect(normalizeReturnTo("//attacker.example")).toBe("/");
    expect(normalizeReturnTo("/focus")).toBe("/focus");
  });
});
