import { describe, expect, it } from "vitest";

import {
  buildGroundedOrbAnswer,
  rankOrbEvidence,
  type OrbEvidenceRecord,
} from "@/lib/intelligence/orb";

const now = new Date("2026-09-20T10:00:00.000Z");
const records: OrbEvidenceRecord[] = [
  {
    id: "mail-1",
    integration: "Gmail",
    sourceType: "gmail-message",
    title: "API ownership decision",
    body: "David needs a final owner before the launch review.",
    occurredAt: new Date("2026-09-20T08:30:00.000Z"),
    metadata: { unread: true, from: "David" },
  },
  {
    id: "event-1",
    integration: "Google Calendar",
    sourceType: "calendar-event",
    title: "Launch review",
    body: "Review launch blockers with the engineering team.",
    occurredAt: new Date("2026-09-20T14:00:00.000Z"),
  },
  {
    id: "mail-2",
    integration: "Gmail",
    sourceType: "gmail-message",
    title: "Atlas proposal",
    body: "Please confirm the pilot markets before Friday.",
    occurredAt: new Date("2026-09-19T16:00:00.000Z"),
  },
];

describe("Orb grounding", () => {
  it("ranks title and intent matches ahead of merely recent records", () => {
    const ranked = rankOrbEvidence("What is blocking the launch review?", records, now);
    expect(ranked[0].record.id).toBe("event-1");
    expect(ranked[1].record.id).toBe("mail-1");
  });

  it("returns only evidence-backed excerpts with citation lineage", () => {
    const result = buildGroundedOrbAnswer("Who needs a reply?", records, "live", now);
    expect(result.answer).toContain("David needs a final owner");
    expect(result.citations[0]).toMatchObject({
      sourceRecordId: "mail-1",
      sourceType: "gmail-message",
    });
    expect(result.suggestedAction).toMatchObject({
      kind: "reply",
      sourceRecordId: "mail-1",
    });
  });

  it("does not offer live actions for fixture evidence", () => {
    const result = buildGroundedOrbAnswer("Who needs a reply?", records, "fixture", now);
    expect(result.mode).toBe("fixture");
    expect(result.suggestedAction).toBeUndefined();
    expect(result.completenessWarning).toContain("Demonstration");
  });

  it("labels weak matches instead of claiming a confident answer", () => {
    const result = buildGroundedOrbAnswer("quantum patents", records, "live", now);
    expect(result.confidence).toBe("limited");
    expect(result.answer).toContain("could not find a strong direct match");
  });
});
