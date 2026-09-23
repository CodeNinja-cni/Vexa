import { describe, expect, it } from "vitest";

import {
  generateOpaqueToken,
  hashOpaqueToken,
  openJson,
  sealJson,
  secureEqual,
} from "@/lib/security/crypto";

const secret = "test-secret-with-at-least-thirty-two-characters";

describe("credential cryptography", () => {
  it("round-trips encrypted JSON without storing plaintext", () => {
    const credential = { accessToken: "access-secret", refreshToken: "refresh-secret" };
    const encrypted = sealJson(credential, secret, "google-credential");

    expect(encrypted).not.toContain("access-secret");
    expect(openJson(encrypted, secret, "google-credential")).toEqual(credential);
  });

  it("rejects tampering and purpose confusion", () => {
    const encrypted = sealJson({ value: 1 }, secret, "oauth-state");

    expect(() => openJson(encrypted, secret, "google-credential")).toThrow();
    expect(() => openJson(`${encrypted}x`, secret, "oauth-state")).toThrow();
  });

  it("creates opaque tokens and compares state safely", () => {
    const token = generateOpaqueToken();

    expect(token).not.toEqual(generateOpaqueToken());
    expect(hashOpaqueToken(token)).toHaveLength(64);
    expect(secureEqual(token, token)).toBe(true);
    expect(secureEqual(token, `${token}x`)).toBe(false);
  });
});
