import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDatabase } from "@/lib/db/client";
import { memberships, organizations, users } from "@/lib/db/schema";

const scrypt = promisify(nodeScrypt);
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_VERSION = "v1";
const DUMMY_PASSWORD_HASH = `scrypt$${SCRYPT_VERSION}$${Buffer.alloc(16).toString("base64url")}$${Buffer.alloc(SCRYPT_KEY_LENGTH).toString("base64url")}`;

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid work email.").max(254),
  jobTitle: z.string().trim().min(2, "Tell us your role.").max(100),
  organizationName: z.string().trim().min(2, "Enter a workspace name.").max(120),
  password: z.string().min(12, "Use at least 12 characters.").max(128)
    .refine((value) => /[a-z]/.test(value), "Add a lowercase letter.")
    .refine((value) => /[A-Z]/.test(value), "Add an uppercase letter.")
    .refine((value) => /\d/.test(value), "Add a number."),
  acceptedTerms: z.literal(true, { error: "Accept the terms to continue." }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export class CredentialAuthError extends Error {
  constructor(
    readonly code: "account_exists" | "invalid_credentials",
    message: string,
  ) {
    super(message);
    this.name = "CredentialAuthError";
  }
}

export function isDatabaseConnectionError(error: unknown): boolean {
  const details: string[] = [];
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();
  while (pending.length && seen.size < 12) {
    const current = pending.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const candidate = current as {
      message?: unknown;
      code?: unknown;
      cause?: unknown;
      errors?: unknown;
    };
    if (typeof candidate.message === "string") details.push(candidate.message);
    if (typeof candidate.code === "string") details.push(candidate.code);
    if (candidate.cause) pending.push(candidate.cause);
    if (Array.isArray(candidate.errors)) pending.push(...candidate.errors);
  }
  return /ECONNREFUSED|ECONNRESET|ENOTFOUND|database.*unavailable|connect.*failed/i.test(
    details.join(" "),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH) as Buffer;
  return [
    "scrypt",
    SCRYPT_VERSION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [algorithm, version, saltValue, hashValue] = encodedHash.split("$");
  if (algorithm !== "scrypt" || version !== SCRYPT_VERSION || !saltValue || !hashValue) {
    return false;
  }
  try {
    const expected = Buffer.from(hashValue, "base64url");
    if (expected.length !== SCRYPT_KEY_LENGTH) return false;
    const actual = await scrypt(
      password,
      Buffer.from(saltValue, "base64url"),
      SCRYPT_KEY_LENGTH,
    ) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function provisionCredentialAccount(
  input: SignupInput,
): Promise<{ organizationId: string; userId: string }> {
  const database = getDatabase();
  const [existing] = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing) {
    throw new CredentialAuthError(
      "account_exists",
      "An account already exists for this email. Log in or use Google instead.",
    );
  }

  const passwordHash = await hashPassword(input.password);
  try {
    return await database.transaction(async (transaction) => {
      const [organization] = await transaction
        .insert(organizations)
        .values({ name: input.organizationName })
        .returning({ id: organizations.id });
      const [user] = await transaction
        .insert(users)
        .values({
          email: input.email,
          displayName: input.displayName,
          jobTitle: input.jobTitle,
          passwordHash,
        })
        .returning({ id: users.id });
      await transaction.insert(memberships).values({
        organizationId: organization.id,
        userId: user.id,
        role: "admin",
      });
      return { organizationId: organization.id, userId: user.id };
    });
  } catch (error) {
    const duplicate = error instanceof Error && /unique|duplicate/i.test(error.message);
    if (duplicate) {
      throw new CredentialAuthError(
        "account_exists",
        "An account already exists for this email. Log in or use Google instead.",
      );
    }
    throw error;
  }
}

export async function authenticateCredentials(
  input: LoginInput,
): Promise<{ organizationId: string; userId: string }> {
  const [account] = await getDatabase()
    .select({
      userId: users.id,
      organizationId: memberships.organizationId,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .where(eq(users.email, input.email))
    .limit(1);

  const valid = account?.passwordHash
    ? await verifyPassword(input.password, account.passwordHash)
    : await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
  if (!account || !valid) {
    throw new CredentialAuthError(
      "invalid_credentials",
      "The email or password is incorrect.",
    );
  }
  return { organizationId: account.organizationId, userId: account.userId };
}
