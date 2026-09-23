import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getGoogleOAuthConfig } from "@/lib/auth/config";
import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations } from "@/lib/db/schema";
import { openJson, sealJson } from "@/lib/security/crypto";
import {
  GOOGLE_CREDENTIAL_PURPOSE,
  GOOGLE_PROVIDER,
  type StoredGoogleCredential,
} from "@/lib/connectors/google/oauth";

const refreshResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

export interface GoogleAccess {
  accessToken: string;
  integrationId: string;
}

export async function getGoogleAccess(principal: Principal): Promise<GoogleAccess> {
  const config = getGoogleOAuthConfig();
  const db = getDatabase();
  const [integration] = await db
    .select({
      id: integrations.id,
      encryptedCredentialReference: integrations.encryptedCredentialReference,
    })
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, principal.organizationId),
        eq(integrations.ownerUserId, principal.userId),
        eq(integrations.provider, GOOGLE_PROVIDER),
      ),
    )
    .limit(1);

  if (!integration?.encryptedCredentialReference) {
    throw new Error("Google Workspace is not connected for this user.");
  }

  const credential = openJson<StoredGoogleCredential>(
    integration.encryptedCredentialReference,
    config.authSecret,
    GOOGLE_CREDENTIAL_PURPOSE,
  );

  if (new Date(credential.expiresAt).getTime() > Date.now() + 60_000) {
    return { accessToken: credential.accessToken, integrationId: integration.id };
  }

  if (!credential.refreshToken) {
    await db
      .update(integrations)
      .set({ status: "degraded", updatedAt: new Date() })
      .where(eq(integrations.id, integration.id));
    throw new Error("Google access expired and no refresh token is available. Reconnect Google.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: credential.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    await db
      .update(integrations)
      .set({ status: "degraded", updatedAt: new Date() })
      .where(eq(integrations.id, integration.id));
    throw new Error("Google rejected the stored refresh token. Reconnect Google Workspace.");
  }

  const refreshed = refreshResponseSchema.parse(await response.json());
  const nextCredential: StoredGoogleCredential = {
    accessToken: refreshed.access_token,
    refreshToken: credential.refreshToken,
    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    scopes: refreshed.scope?.split(" ").filter(Boolean) ?? credential.scopes,
    tokenType: refreshed.token_type ?? credential.tokenType,
  };

  await db
    .update(integrations)
    .set({
      status: "connected",
      encryptedCredentialReference: sealJson(
        nextCredential,
        config.authSecret,
        GOOGLE_CREDENTIAL_PURPOSE,
      ),
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, integration.id));

  return { accessToken: nextCredential.accessToken, integrationId: integration.id };
}
