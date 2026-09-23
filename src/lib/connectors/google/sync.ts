import { eq, sql } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import type { ConnectorContext, SourceRecord } from "@/lib/connectors/contract";
import { GoogleCalendarConnector } from "@/lib/connectors/google/calendar";
import { getGoogleAccess } from "@/lib/connectors/google/credential";
import { GoogleGmailConnector } from "@/lib/connectors/google/gmail";
import { getDatabase } from "@/lib/db/client";
import { integrations, sourceRecords } from "@/lib/db/schema";

export interface ConnectorSyncResult {
  provider: "gmail" | "calendar";
  status: "succeeded" | "failed";
  recordCount: number;
  error?: string;
}

async function persistRecords(
  principal: Principal,
  integrationId: string,
  records: SourceRecord[],
): Promise<void> {
  if (records.length === 0) return;

  const db = getDatabase();
  await db
    .insert(sourceRecords)
    .values(
      records.map((record) => ({
        organizationId: principal.organizationId,
        integrationId,
        externalId: record.externalId,
        category: record.category,
        sourceType: record.sourceType,
        title: record.title,
        body: record.body,
        sourceUrl: record.sourceUrl,
        occurredAt: new Date(record.occurredAt),
        rawPayload: record.metadata,
      })),
    )
    .onConflictDoUpdate({
      target: [
        sourceRecords.organizationId,
        sourceRecords.integrationId,
        sourceRecords.externalId,
      ],
      set: {
        category: sql`excluded.category`,
        sourceType: sql`excluded.source_type`,
        title: sql`excluded.title`,
        body: sql`excluded.body`,
        sourceUrl: sql`excluded.source_url`,
        occurredAt: sql`excluded.occurred_at`,
        rawPayload: sql`excluded.raw_payload`,
        updatedAt: new Date(),
      },
    });
}

export async function synchronizeGoogleWorkspace(
  principal: Principal,
  correlationId: string,
): Promise<ConnectorSyncResult[]> {
  const access = await getGoogleAccess(principal);
  const context: ConnectorContext = {
    organizationId: principal.organizationId,
    userId: principal.userId,
    correlationId,
  };
  const connectors = [
    { provider: "gmail" as const, adapter: new GoogleGmailConnector(access.accessToken) },
    {
      provider: "calendar" as const,
      adapter: new GoogleCalendarConnector(access.accessToken),
    },
  ];

  const results = await Promise.all(
    connectors.map(async ({ provider, adapter }): Promise<ConnectorSyncResult> => {
      try {
        const synchronized = await adapter.synchronize(context);
        await persistRecords(
          principal,
          access.integrationId,
          synchronized.records,
        );
        return {
          provider,
          status: "succeeded",
          recordCount: synchronized.records.length,
        };
      } catch (error) {
        return {
          provider,
          status: "failed",
          recordCount: 0,
          error: error instanceof Error ? error.message : "Connector sync failed.",
        };
      }
    }),
  );

  const failed = results.some((result) => result.status === "failed");
  await getDatabase()
    .update(integrations)
    .set({
      status: failed ? "degraded" : "connected",
      lastSynchronizedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, access.integrationId));

  return results;
}
