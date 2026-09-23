import { describe, expect, it } from "vitest";

import {
  prepareDeterministicReply,
  type EvidenceRecord,
} from "@/lib/intelligence/grounding";

const email: EvidenceRecord = {
  id: "00000000-0000-4000-8000-000000000011",
  sourceType: "gmail-message",
  title: "Launch scope",
  body: "Can you confirm the two pilot markets before Friday?",
  sourceUrl: "https://mail.google.com/mail/u/0/#inbox/thread-1",
  occurredAt: new Date("2026-09-19T08:00:00.000Z"),
  metadata: {
    from: "Amara Mensah <amara@example.com>",
    threadId: "thread-1",
  },
};

describe("grounded deterministic replies", () => {
  it("prepares a reply with evidence lineage and no invented answer", () => {
    const draft = prepareDeterministicReply([email]);

    expect(draft.subject).toBe("Re: Launch scope");
    expect(draft.body).toContain("Hi Amara,");
    expect(draft.body).not.toContain("Nigeria");
    expect(draft.groundingMode).toBe("deterministic");
    expect(draft.evidence[0].sourceRecordId).toBe(email.id);
  });

  it("supports a formal fallback without changing source facts", () => {
    const draft = prepareDeterministicReply([email], "Use a formal tone");

    expect(draft.body).toContain("Best regards,");
    expect(draft.evidence[0].excerpt).toContain("pilot markets");
  });

  it("rejects a draft without Gmail evidence", () => {
    expect(() =>
      prepareDeterministicReply([
        { ...email, sourceType: "calendar-event" },
      ]),
    ).toThrow(/Gmail/);
  });
});
