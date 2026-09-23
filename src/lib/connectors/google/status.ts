import "server-only";

import { and, eq } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations } from "@/lib/db/schema";
import { GOOGLE_PROVIDER } from "@/lib/connectors/google/oauth";

export async function hasConnectedGoogleIntegration(
  principal: Principal,
): Promise<boolean> {
  const [integration] = await getDatabase()
    .select({ id: integrations.id })
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, principal.organizationId),
        eq(integrations.ownerUserId, principal.userId),
        eq(integrations.provider, GOOGLE_PROVIDER),
        eq(integrations.status, "connected"),
        eq(integrations.isFixture, false),
      ),
    )
    .limit(1);
  return Boolean(integration);
}
