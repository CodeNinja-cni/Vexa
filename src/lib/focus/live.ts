import "server-only";

import { and, asc, eq, gte, lte } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { integrations, sourceRecords } from "@/lib/db/schema";
import type { FocusPlanResponse } from "@/lib/focus/contracts";
import { planFocusDay, workdayBounds } from "@/lib/focus/planner";

function metadataString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

export async function getLiveFocusPlan(
  principal: Principal,
  now = new Date(),
): Promise<FocusPlanResponse> {
  const timeZone = process.env.VEXA_TIME_ZONE ?? "Africa/Lagos";
  const { dayStart, dayEnd } = workdayBounds(now, timeZone);
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
        eq(sourceRecords.sourceType, "calendar-event"),
        eq(integrations.organizationId, principal.organizationId),
        eq(integrations.ownerUserId, principal.userId),
        eq(integrations.isFixture, false),
        gte(sourceRecords.occurredAt, new Date(dayStart.getTime() - 86_400_000)),
        lte(sourceRecords.occurredAt, dayEnd),
      ),
    )
    .orderBy(asc(sourceRecords.occurredAt))
    .limit(100);

  const events = records.map((record) => {
    const startValue = metadataString(record.metadata, "start");
    const endValue = metadataString(record.metadata, "end");
    return {
      id: record.id,
      title: record.title,
      startAt: startValue ? new Date(startValue) : record.occurredAt,
      endAt: endValue
        ? new Date(endValue)
        : new Date(record.occurredAt.getTime() + 30 * 60_000),
      location: metadataString(record.metadata, "location") ?? record.body,
      sourceUrl: record.sourceUrl ?? undefined,
      cancelled: record.metadata?.cancelled === true,
    };
  });

  return planFocusDay(events, {
    now,
    dayStart,
    dayEnd,
    timeZone,
    mode: "live",
    completenessWarning:
      "Google Calendar is live. Proposed focus blocks are not written back until calendar write access and an idempotent executor are enabled.",
  });
}
