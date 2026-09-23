import { z } from "zod";

import type {
  ConnectorAdapter,
  ConnectorContext,
  ConnectorHealth,
  SourceRecord,
} from "@/lib/connectors/contract";

const calendarEventSchema = z.object({
  id: z.string(),
  status: z.string().default("confirmed"),
  summary: z.string().default("Untitled event"),
  description: z.string().optional(),
  location: z.string().optional(),
  htmlLink: z.string().url().optional(),
  hangoutLink: z.string().url().optional(),
  start: z.object({ dateTime: z.string().optional(), date: z.string().optional() }),
  end: z.object({ dateTime: z.string().optional(), date: z.string().optional() }),
  organizer: z.object({ email: z.string().optional(), displayName: z.string().optional() }).optional(),
  attendees: z.array(z.object({ email: z.string().optional(), responseStatus: z.string().optional() })).default([]),
  updated: z.string().datetime().optional(),
});

const eventListSchema = z.object({
  items: z.array(calendarEventSchema).default([]),
  nextPageToken: z.string().optional(),
});

type CalendarEvent = z.infer<typeof calendarEventSchema>;

export function normalizeCalendarEvent(
  event: CalendarEvent,
  ingestedAt = new Date().toISOString(),
): SourceRecord {
  const start = event.start.dateTime ?? event.start.date;
  const occurredAt = start ? new Date(start) : new Date(ingestedAt);
  const body = [event.description, event.location]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return {
    id: `calendar-${event.id}`,
    externalId: event.id,
    integration: "Google Workspace",
    category: "work",
    sourceType: "calendar-event",
    title: event.summary,
    body: body || "Calendar event",
    sourceUrl: event.hangoutLink ?? event.htmlLink,
    occurredAt: Number.isNaN(occurredAt.getTime())
      ? ingestedAt
      : occurredAt.toISOString(),
    ingestedAt,
    metadata: {
      start: start ?? null,
      end: event.end.dateTime ?? event.end.date ?? null,
      location: event.location ?? null,
      organizer: event.organizer?.email ?? null,
      attendeeCount: event.attendees.length,
      cancelled: event.status === "cancelled",
    },
  };
}

export class GoogleCalendarConnector implements ConnectorAdapter {
  readonly id = "google-calendar";
  readonly displayName = "Google Calendar";
  readonly capabilities = new Set(["read", "search"] as const);

  constructor(private readonly accessToken: string) {}

  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async health(): Promise<ConnectorHealth> {
    return { status: "connected" };
  }

  async synchronize(
    _context: ConnectorContext,
    cursor?: string,
  ): Promise<{ records: SourceRecord[]; nextCursor?: string }> {
    const url = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    );
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set(
      "timeMin",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );
    url.searchParams.set(
      "timeMax",
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    );
    if (cursor) url.searchParams.set("pageToken", cursor);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Calendar API request failed with status ${response.status}.`);
    }

    const list = eventListSchema.parse(await response.json());
    return {
      records: list.items.map((event) => normalizeCalendarEvent(event)),
      nextCursor: list.nextPageToken,
    };
  }
}
