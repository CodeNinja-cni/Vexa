import { describe, expect, it } from "vitest";

import { planFocusDay, workdayBounds, type FocusSourceEvent } from "@/lib/focus/planner";

const dayStart = new Date("2026-09-21T08:00:00.000Z");
const dayEnd = new Date("2026-09-21T16:30:00.000Z");
const now = new Date("2026-09-21T08:00:00.000Z");

function plan(events: FocusSourceEvent[]) {
  return planFocusDay(events, {
    now,
    dayStart,
    dayEnd,
    timeZone: "Africa/Lagos",
    mode: "live",
  });
}

describe("planFocusDay", () => {
  it("detects overlapping calendar conflicts and counts union busy time", () => {
    const result = plan([
      { id: "one", title: "Review", startAt: new Date("2026-09-21T09:00:00.000Z"), endAt: new Date("2026-09-21T10:00:00.000Z") },
      { id: "two", title: "Stand-up", startAt: new Date("2026-09-21T09:30:00.000Z"), endAt: new Date("2026-09-21T10:30:00.000Z") },
    ]);

    expect(result.summary.conflicts).toBe(2);
    expect(result.summary.busyMinutes).toBe(90);
    expect(result.events.every((event) => event.conflict)).toBe(true);
  });

  it("ignores cancelled and invalid events", () => {
    const result = plan([
      { id: "cancelled", title: "Cancelled", startAt: new Date("2026-09-21T10:00:00.000Z"), endAt: new Date("2026-09-21T11:00:00.000Z"), cancelled: true },
      { id: "invalid", title: "Invalid", startAt: new Date("2026-09-21T12:00:00.000Z"), endAt: new Date("2026-09-21T11:00:00.000Z") },
    ]);

    expect(result.events).toEqual([]);
    expect(result.summary.busyMinutes).toBe(0);
  });

  it("proposes at most two focus blocks with buffers around meetings", () => {
    const result = plan([
      { id: "one", title: "Stand-up", startAt: new Date("2026-09-21T09:00:00.000Z"), endAt: new Date("2026-09-21T09:30:00.000Z") },
      { id: "two", title: "Review", startAt: new Date("2026-09-21T12:00:00.000Z"), endAt: new Date("2026-09-21T13:00:00.000Z") },
    ]);

    expect(result.proposals).toHaveLength(2);
    expect(result.proposals.every((proposal) => proposal.durationMinutes >= 45)).toBe(true);
    expect(new Date(result.proposals[0].startAt).getTime()).toBeGreaterThanOrEqual(
      new Date("2026-09-21T09:40:00.000Z").getTime(),
    );
  });

  it("does not propose time earlier than the rounded current time", () => {
    const result = planFocusDay([], {
      now: new Date("2026-09-21T11:07:00.000Z"),
      dayStart,
      dayEnd,
      timeZone: "Africa/Lagos",
      mode: "live",
    });

    expect(result.proposals[0].startAt).toBe("2026-09-21T11:10:00.000Z");
  });

  it("moves weekend planning to the next local workday", () => {
    const bounds = workdayBounds(
      new Date("2026-09-20T12:00:00.000Z"),
      "Africa/Lagos",
    );

    expect(bounds.dayStart.toISOString()).toBe("2026-09-21T08:00:00.000Z");
    expect(bounds.dayEnd.toISOString()).toBe("2026-09-21T16:30:00.000Z");
  });
});
