import { describe, expect, it } from "vitest";

import { aggregateRelationships } from "@/lib/relationships/aggregation";

const now = new Date("2026-09-20T12:00:00.000Z");

describe("aggregateRelationships", () => {
  it("groups messages by contact and preserves evidence direction", () => {
    const people = aggregateRelationships([
      {
        id: "one",
        title: "Launch question",
        body: "Can you confirm the final owner?",
        occurredAt: new Date("2026-09-20T10:00:00.000Z"),
        metadata: { from: "David Kim <david@example.com>", unread: true },
      },
      {
        id: "two",
        title: "Re: Launch question",
        body: "I will share the owner shortly.",
        occurredAt: new Date("2026-09-19T10:00:00.000Z"),
        metadata: { from: "Me <me@example.com>", to: "David Kim <david@example.com>" },
      },
    ], "me@example.com", now);

    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({
      name: "David Kim",
      email: "david@example.com",
      messageCount: 2,
      inboundCount: 1,
      outboundCount: 1,
      signal: "needs_reply",
    });
    expect(people[0].evidence.map((item) => item.direction)).toEqual(["inbound", "outbound"]);
  });

  it("surfaces commercial signals above ordinary relationships", () => {
    const people = aggregateRelationships([
      {
        id: "ordinary",
        title: "Weekly update",
        body: "Sharing the weekly notes.",
        occurredAt: new Date("2026-09-20T11:30:00.000Z"),
        metadata: { from: "Maya <maya@example.com>" },
      },
      {
        id: "opportunity",
        title: "Partnership pilot",
        body: "We would like to discuss an investment and pilot proposal.",
        occurredAt: new Date("2026-09-20T09:00:00.000Z"),
        metadata: { from: "Amara <amara@example.com>" },
      },
    ], "me@example.com", now);

    expect(people[0]).toMatchObject({
      email: "amara@example.com",
      signal: "opportunity",
    });
  });

  it("marks an outbound latest exchange as waiting", () => {
    const [person] = aggregateRelationships([
      {
        id: "outbound",
        title: "Security overview",
        body: "Sharing the promised security overview.",
        occurredAt: new Date("2026-09-20T08:00:00.000Z"),
        metadata: { from: "Me <me@example.com>", to: "Tunde <tunde@example.com>" },
      },
    ], "me@example.com", now);

    expect(person.signal).toBe("waiting");
    expect(person.commitments[0]?.status).toBe("waiting");
  });

  it("ignores messages that cannot be tied to an external email address", () => {
    const people = aggregateRelationships([
      {
        id: "unknown",
        title: "System notice",
        body: "No sender address.",
        occurredAt: now,
        metadata: { from: "Unknown sender" },
      },
    ], "me@example.com", now);

    expect(people).toEqual([]);
  });
});
