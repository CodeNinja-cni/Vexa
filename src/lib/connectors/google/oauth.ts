import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { GoogleOAuthConfig } from "@/lib/auth/config";
import { getDatabase } from "@/lib/db/client";
import {
  integrations,
  memberships,
  organizations,
  users,
} from "@/lib/db/schema";
import { openJson, sealJson } from "@/lib/security/crypto";

export const GOOGLE_PROVIDER = "google-workspace";
export const GOOGLE_CREDENTIAL_PURPOSE = "google-oauth-credential";
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).optional(),
  scope: z.string().optional(),
  token_type: z.string().default("Bearer"),
});

const googleUserSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  email_verified: z.boolean(),
  name: z.string().min(1),
  picture: z.string().url().optional(),
});

export interface StoredGoogleCredential {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scopes: string[];
  tokenType: string;
}

export type GoogleUser = z.infer<typeof googleUserSchema>;

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  return body.slice(0, 500) || response.statusText;
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  verifier: string,
  config: GoogleOAuthConfig,
): Promise<StoredGoogleCredential> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await readError(response)}`);
  }

  const token = tokenResponseSchema.parse(await response.json());

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    scopes: token.scope?.split(" ").filter(Boolean) ?? [],
    tokenType: token.token_type,
  };
}

export async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google user lookup failed: ${await readError(response)}`);
  }

  const user = googleUserSchema.parse(await response.json());
  if (!user.email_verified) {
    throw new Error("Google did not verify this account's email address.");
  }

  return user;
}

export async function provisionGoogleAccount(
  googleUser: GoogleUser,
  credential: StoredGoogleCredential,
  authSecret: string,
): Promise<{ organizationId: string; userId: string; integrationId: string }> {
  const db = getDatabase();
  const capabilities = [
    credential.scopes.includes("https://www.googleapis.com/auth/gmail.readonly")
      ? "gmail.read"
      : null,
    credential.scopes.includes("https://www.googleapis.com/auth/calendar.readonly")
      ? "calendar.read"
      : null,
  ].filter((capability): capability is string => capability !== null);

  return db.transaction(async (transaction) => {
    const [user] = await transaction
      .insert(users)
      .values({ email: googleUser.email, displayName: googleUser.name })
      .onConflictDoUpdate({
        target: users.email,
        set: { displayName: googleUser.name, updatedAt: new Date() },
      })
      .returning({ id: users.id });

    let [membership] = await transaction
      .select({ organizationId: memberships.organizationId })
      .from(memberships)
      .where(eq(memberships.userId, user.id))
      .limit(1);

    if (!membership) {
      const [organization] = await transaction
        .insert(organizations)
        .values({ name: `${googleUser.name}'s workspace` })
        .returning({ id: organizations.id });

      [membership] = await transaction
        .insert(memberships)
        .values({
          organizationId: organization.id,
          userId: user.id,
          role: "admin",
        })
        .returning({ organizationId: memberships.organizationId });
    }

    const [existingIntegration] = await transaction
      .select({
        id: integrations.id,
        encryptedCredentialReference: integrations.encryptedCredentialReference,
      })
      .from(integrations)
      .where(
        and(
          eq(integrations.organizationId, membership.organizationId),
          eq(integrations.provider, GOOGLE_PROVIDER),
          eq(integrations.externalAccountId, googleUser.sub),
        ),
      )
      .limit(1);

    let refreshToken = credential.refreshToken;
    if (!refreshToken && existingIntegration?.encryptedCredentialReference) {
      const existing = openJson<StoredGoogleCredential>(
        existingIntegration.encryptedCredentialReference,
        authSecret,
        GOOGLE_CREDENTIAL_PURPOSE,
      );
      refreshToken = existing.refreshToken;
    }

    const encryptedCredential = sealJson(
      { ...credential, refreshToken },
      authSecret,
      GOOGLE_CREDENTIAL_PURPOSE,
    );

    const [integration] = await transaction
      .insert(integrations)
      .values({
        organizationId: membership.organizationId,
        ownerUserId: user.id,
        provider: GOOGLE_PROVIDER,
        externalAccountId: googleUser.sub,
        status: "connected",
        capabilities,
        encryptedCredentialReference: encryptedCredential,
        isFixture: false,
      })
      .onConflictDoUpdate({
        target: [
          integrations.organizationId,
          integrations.provider,
          integrations.externalAccountId,
        ],
        set: {
          ownerUserId: user.id,
          status: "connected",
          capabilities,
          encryptedCredentialReference: encryptedCredential,
          isFixture: false,
          updatedAt: new Date(),
        },
      })
      .returning({ id: integrations.id });

    return {
      organizationId: membership.organizationId,
      userId: user.id,
      integrationId: integration.id,
    };
  });
}
