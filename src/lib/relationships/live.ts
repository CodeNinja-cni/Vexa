import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations, sourceRecords } from "@/lib/db/schema";
import { aggregateRelationships } from "@/lib/relationships/aggregation";
import {
  relationshipsResponseSchema,
  summarizeRelationships,
  type RelationshipsResponse,
} from "@/lib/relationships/contracts";

export async function getLiveRelationships(
  principal: Principal,
  now = new Date(),
): Promise<RelationshipsResponse> {
  const records = await getDatabase()
    .select({
      id: sourceRecords.id,
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
        eq(sourceRecords.sourceType, "gmail-message"),
        eq(integrations.organizationId, principal.organizationId),
        eq(integrations.ownerUserId, principal.userId),
        eq(integrations.isFixture, false),
        gte(sourceRecords.occurredAt, new Date(now.getTime() - 60 * 86_400_000)),
      ),
    )
    .orderBy(desc(sourceRecords.occurredAt))
    .limit(200);

  const people = aggregateRelationships(
    records.map((record) => ({
      ...record,
      sourceUrl: record.sourceUrl ?? undefined,
    })),
    principal.email,
    now,
  );

  return relationshipsResponseSchema.parse({
    mode: "live",
    generatedAt: now.toISOString(),
    completenessWarning:
      "Relationship memory is derived from recent Gmail metadata. LinkedIn, Slack, meetings, and CRM context remain demonstration-only.",
    people,
    summary: summarizeRelationships(people),
  });
}
