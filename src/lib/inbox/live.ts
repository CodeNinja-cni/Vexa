import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations, sourceRecords } from "@/lib/db/schema";
import { classifyInboxRecord, rankInbox } from "@/lib/inbox/classification";
import {
  inboxResponseSchema,
  summarizeInbox,
  type InboxResponse,
} from "@/lib/inbox/contracts";

export async function getLiveInbox(
  principal: Principal,
  now = new Date(),
): Promise<InboxResponse> {
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
        gte(sourceRecords.occurredAt, new Date(now.getTime() - 30 * 86_400_000)),
      ),
    )
    .orderBy(desc(sourceRecords.occurredAt))
    .limit(100);

  const items = rankInbox(
    records.map((record) =>
      classifyInboxRecord(
        {
          ...record,
          sourceUrl: record.sourceUrl ?? undefined,
        },
        principal.email,
        now,
      ),
    ),
  );

  return inboxResponseSchema.parse({
    mode: "live",
    generatedAt: now.toISOString(),
    completenessWarning:
      "Gmail is live. LinkedIn, Slack, WhatsApp, and other channels remain demonstration-only.",
    items,
    summary: summarizeInbox(items),
  });
}
