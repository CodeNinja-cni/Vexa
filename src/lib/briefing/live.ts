import { and, desc, eq, gte } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { sourceRecords } from "@/lib/db/schema";
import type { BriefingItem, Urgency } from "@/lib/domain/models";
import { rankBriefingItems } from "@/lib/domain/ranking";

export interface DashboardScheduleItem {
  time: string;
  title: string;
  meta: string;
}

function stringMetadata(
  metadata: Record<string, unknown> | null,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function booleanMetadata(
  metadata: Record<string, unknown> | null,
  key: string,
): boolean {
  return metadata?.[key] === true;
}

function relativeLabel(date: Date, now: Date, future: boolean): string {
  const minutes = Math.max(
    1,
    Math.round(Math.abs(date.getTime() - now.getTime()) / 60_000),
  );
  if (minutes < 60) return future ? `In ${minutes} min` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return future ? `In ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return future ? `In ${days}d` : `${days}d ago`;
}

function urgencyForRecord(
  sourceType: string,
  occurredAt: Date,
  metadata: Record<string, unknown> | null,
  now: Date,
): Urgency {
  const differenceHours = (occurredAt.getTime() - now.getTime()) / 3_600_000;
  if (sourceType === "calendar-event") {
    if (differenceHours >= 0 && differenceHours <= 2) return "critical";
    if (differenceHours > 2 && differenceHours <= 24) return "high";
  }
  if (sourceType === "gmail-message" && booleanMetadata(metadata, "unread")) {
    return differenceHours >= -24 ? "high" : "normal";
  }
  return "normal";
}

export async function getLiveDashboardData(
  principal: Principal,
  now = new Date(),
): Promise<{
  briefingItems: BriefingItem[];
  schedule: DashboardScheduleItem[];
  recordCount: number;
}> {
  const records = await getDatabase()
    .select()
    .from(sourceRecords)
    .where(
      and(
        eq(sourceRecords.organizationId, principal.organizationId),
        gte(
          sourceRecords.occurredAt,
          new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        ),
      ),
    )
    .orderBy(desc(sourceRecords.occurredAt))
    .limit(100);

  const briefingItems = records
    .filter((record) => {
      if (record.sourceType === "calendar-event") {
        return (
          record.occurredAt.getTime() >= now.getTime() - 60 * 60 * 1000 &&
          record.occurredAt.getTime() <= now.getTime() + 48 * 60 * 60 * 1000
        );
      }
      return booleanMetadata(record.rawPayload, "unread");
    })
    .slice(0, 12)
    .map((record): BriefingItem => {
      const calendar = record.sourceType === "calendar-event";
      const from = stringMetadata(record.rawPayload, "from");

      return {
        id: record.id,
        category: record.category,
        urgency: urgencyForRecord(
          record.sourceType,
          record.occurredAt,
          record.rawPayload,
          now,
        ),
        title: calendar ? `Prepare for ${record.title}` : record.title,
        summary: calendar
          ? record.body
          : `${from ? `${from}: ` : ""}${record.body}`,
        rationale: calendar
          ? "This is on your calendar soon, so preparation now reduces meeting risk."
          : "This unread conversation is recent and may be waiting on your response.",
        dueLabel: relativeLabel(
          record.occurredAt,
          now,
          record.occurredAt.getTime() >= now.getTime(),
        ),
        citations: [
          {
            id: `citation-${record.id}`,
            integration: "Google Workspace",
            sourceType: record.sourceType,
            sourceLabel: record.title,
            sourceUrl: record.sourceUrl ?? undefined,
            observedAt: record.occurredAt.toISOString(),
          },
        ],
        action: calendar
          ? {
              id: `action-${record.id}`,
              kind: "open",
              label: "Open event",
              destination: "Google Calendar",
              status: "recommended",
            }
          : {
              id: `action-${record.id}`,
              kind: "reply",
              label: "Prepare a reply",
              destination: "Gmail thread",
              status: "recommended",
            },
      };
    });

  const timeZone = process.env.VEXA_TIME_ZONE ?? "Africa/Lagos";
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
  const schedule = records
    .filter(
      (record) =>
        record.sourceType === "calendar-event" &&
        record.occurredAt.getTime() >= now.getTime() &&
        record.occurredAt.getTime() <= now.getTime() + 24 * 60 * 60 * 1000,
    )
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
    .slice(0, 6)
    .map((record) => ({
      time: timeFormatter.format(record.occurredAt),
      title: record.title,
      meta: `${stringMetadata(record.rawPayload, "location") ?? "Google Calendar"} · live`,
    }));

  return {
    briefingItems: rankBriefingItems(briefingItems).slice(0, 5),
    schedule,
    recordCount: records.length,
  };
}
