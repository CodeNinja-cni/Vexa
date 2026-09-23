import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations, sourceRecords } from "@/lib/db/schema";
import type { OrbEvidenceRecord } from "@/lib/intelligence/orb";

function integrationName(sourceType: string): string {
  if (sourceType === "gmail-message") return "Gmail";
  if (sourceType === "calendar-event") return "Google Calendar";
  return "Google Workspace";
}

export async function retrieveOrbEvidence(
  principal: Principal,
  now = new Date(),
): Promise<OrbEvidenceRecord[]> {
  const rows = await getDatabase()
    .select({
      id: sourceRecords.id,
      sourceType: sourceRecords.sourceType,
      title: sourceRecords.title,
      body: sourceRecords.body,
      sourceUrl: sourceRecords.sourceUrl,
      occurredAt: sourceRecords.occurredAt,
      metadata: sourceRecords.rawPayload,
    })
    .from(sourceRecords)
    .innerJoin(integrations, eq(integrations.id, sourceRecords.integrationId))
    .where(
      and(
        eq(sourceRecords.organizationId, principal.organizationId),
        eq(integrations.organizationId, principal.organizationId),
        eq(integrations.ownerUserId, principal.userId),
        eq(integrations.isFixture, false),
        gte(sourceRecords.occurredAt, new Date(now.getTime() - 30 * 86_400_000)),
      ),
    )
    .orderBy(desc(sourceRecords.occurredAt))
    .limit(150);

  return rows.map((row) => ({
    id: row.id,
    integration: integrationName(row.sourceType),
    sourceType: row.sourceType,
    title: row.title,
    body: row.body,
    sourceUrl: row.sourceUrl ?? undefined,
    occurredAt: row.occurredAt,
    metadata: row.metadata,
  }));
}
