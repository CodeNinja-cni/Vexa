import { describe, expect, it } from "vitest";

import {
  hashPassword,
  isDatabaseConnectionError,
  loginSchema,
  signupSchema,
  verifyPassword,
} from "@/lib/auth/credentials";

describe("credential authentication", () => {
  it("hashes passwords without storing plaintext and verifies safely", async () => {
    const password = "StrongPassword2026";
    const encoded = await hashPassword(password);

    expect(encoded).not.toContain(password);
    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword2026", encoded)).resolves.toBe(false);
  });

  it("rejects malformed password hashes", async () => {
    await expect(verifyPassword("anything", "not-a-valid-hash")).resolves.toBe(false);
  });

  it("requires only essential valid signup fields and explicit consent", () => {
    const result = signupSchema.safeParse({
      displayName: "Chidi Okoro",
      email: "CHIDI@example.com",
      jobTitle: "Founder",
      organizationName: "Vexa Labs",
      password: "StrongPassword2026",
      acceptedTerms: true,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("chidi@example.com");
  });

  it("returns validation errors for weak credentials", () => {
    expect(signupSchema.safeParse({
      displayName: "C",
      email: "invalid",
      jobTitle: "",
      organizationName: "",
      password: "password",
      acceptedTerms: false,
    }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
  });

  it("recognizes nested aggregate database connection failures", () => {
    expect(isDatabaseConnectionError({
      errors: [{ code: "ECONNREFUSED", message: "connect refused" }],
    })).toBe(true);
    expect(isDatabaseConnectionError(new Error("ordinary failure"))).toBe(false);
  });
});
