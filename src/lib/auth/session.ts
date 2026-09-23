import { and, eq, gt } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { getDatabase } from "@/lib/db/client";
import {
  organizations,
  userSessions,
  users,
} from "@/lib/db/schema";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "@/lib/security/crypto";

export const SESSION_COOKIE = "vexa_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface Principal {
  sessionId: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  email: string;
  displayName: string;
}

export async function createSession(
  organizationId: string,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await getDatabase().insert(userSessions).values({
    organizationId,
    userId,
    tokenHash: hashOpaqueToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getPrincipalForSessionToken(
  token: string | undefined,
): Promise<Principal | null> {
  if (!token) return null;

  const db = getDatabase();
  const [principal] = await db
    .select({
      sessionId: userSessions.id,
      organizationId: organizations.id,
      organizationName: organizations.name,
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(userSessions)
    .innerJoin(users, eq(users.id, userSessions.userId))
    .innerJoin(
      organizations,
      eq(organizations.id, userSessions.organizationId),
    )
    .where(
      and(
        eq(userSessions.tokenHash, hashOpaqueToken(token)),
        gt(userSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!principal) return null;

  await db
    .update(userSessions)
    .set({ lastSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(userSessions.id, principal.sessionId));

  return principal;
}

export function getRequestPrincipal(request: NextRequest): Promise<Principal | null> {
  return getPrincipalForSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;

  await getDatabase()
    .delete(userSessions)
    .where(eq(userSessions.tokenHash, hashOpaqueToken(token)));
}
