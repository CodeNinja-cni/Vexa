import { describe, expect, it } from "vitest";

import { classifyInboxRecord, rankInbox } from "@/lib/inbox/classification";

const now = new Date("2026-09-20T12:00:00.000Z");

describe("Inbox classification", () => {
  it("prioritizes unread decision requests", () => {
    const item = classifyInboxRecord(
      {
        id: "mail-1",
        title: "Launch decision required",
        body: "Can you confirm the final owner before review?",
        occurredAt: new Date("2026-09-20T11:00:00.000Z"),
        metadata: { from: "David Kim <david@example.com>", unread: true },
      },
      "me@example.com",
      now,
    );
    expect(item.category).toBe("priority");
    expect(item.priorityScore).toBeGreaterThan(85);
    expect(item.senderName).toBe("David Kim");
  });

  it("separates outbound waiting messages and opportunity signals", () => {
    const waiting = classifyInboxRecord(
      {
        id: "mail-2",
        title: "Checking in",
        body: "Following up on the note.",
        occurredAt: now,
        metadata: { from: "Me <me@example.com>" },
      },
      "me@example.com",
      now,
    );
    const opportunity = classifyInboxRecord(
      {
        id: "mail-3",
        title: "Partnership invitation",
        body: "We would like to invite you into the pilot.",
        occurredAt: now,
        metadata: { from: "Amara <amara@example.com>" },
      },
      "me@example.com",
      now,
    );
    expect(waiting.category).toBe("waiting");
    expect(opportunity.category).toBe("opportunity");
  });

  it("ranks higher-impact messages first", () => {
    const low = classifyInboxRecord(
      { id: "low", title: "Newsletter", body: "Weekly update", occurredAt: now },
      "me@example.com",
      now,
    );
    const high = classifyInboxRecord(
      { id: "high", title: "Urgent decision", body: "Approve?", occurredAt: now, metadata: { unread: true } },
      "me@example.com",
      now,
    );
    expect(rankInbox([low, high])[0].id).toBe("high");
  });
});
