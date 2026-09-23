import { describe, expect, it } from "vitest";

import { normalizeCalendarEvent } from "@/lib/connectors/google/calendar";
import { normalizeGmailMessage } from "@/lib/connectors/google/gmail";

describe("Google record normalization", () => {
  it("normalizes Gmail metadata without exposing a message body", () => {
    const record = normalizeGmailMessage(
      {
        id: "message-1",
        threadId: "thread-1",
        labelIds: ["INBOX", "UNREAD"],
        snippet: "Please approve the launch plan.",
        internalDate: "1790236800000",
        payload: {
          headers: [
            { name: "Subject", value: "Launch approval" },
            { name: "From", value: "Ada <ada@example.com>" },
          ],
        },
      },
      "2026-09-18T09:00:00.000Z",
    );

    expect(record.title).toBe("Launch approval");
    expect(record.metadata.unread).toBe(true);
    expect(record.sourceUrl).toContain("thread-1");
  });

  it("normalizes timed and all-day Calendar events", () => {
    const timed = normalizeCalendarEvent({
      id: "event-1",
      status: "confirmed",
      summary: "Launch review",
      start: { dateTime: "2026-09-18T14:00:00.000Z" },
      end: { dateTime: "2026-09-18T15:00:00.000Z" },
      attendees: [{ email: "team@example.com", responseStatus: "accepted" }],
    });
    const allDay = normalizeCalendarEvent({
      id: "event-2",
      status: "confirmed",
      summary: "Launch day",
      start: { date: "2026-09-19" },
      end: { date: "2026-09-20" },
      attendees: [],
    });

    expect(timed.metadata.attendeeCount).toBe(1);
    expect(allDay.occurredAt).toBe("2026-09-19T00:00:00.000Z");
  });
});
