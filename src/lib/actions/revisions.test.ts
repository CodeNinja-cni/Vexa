import { describe, expect, it } from "vitest";

import { buildRevisedReplyPayload } from "@/lib/actions/revisions";

const current = {
  kind: "reply",
  payload: {
    type: "gmail.reply.draft",
    subject: "Original subject",
    body: "Original body",
    destination: "thread-123",
    groundingMode: "deterministic",
    sourceRecordIds: ["source-1"],
    evidence: [{ sourceRecordId: "source-1", excerpt: "Original evidence" }],
  },
};

describe("reply payload revisions", () => {
  it("changes only the user-editable subject and body", () => {
    const revised = buildRevisedReplyPayload(current, {
      subject: " Updated subject ",
      body: " Updated body ",
    });

    expect(revised).toMatchObject({
      type: "gmail.reply.draft",
      subject: "Updated subject",
      body: "Updated body",
      destination: "thread-123",
      groundingMode: "deterministic",
      sourceRecordIds: ["source-1"],
      evidence: [{ sourceRecordId: "source-1", excerpt: "Original evidence" }],
    });
  });

  it("rejects empty bodies and non-reply actions", () => {
    expect(() => buildRevisedReplyPayload(current, { body: "   " })).toThrow(
      "between 1 and 10,000",
    );
    expect(() =>
      buildRevisedReplyPayload({ ...current, kind: "schedule" }, { body: "Move it" }),
    ).toThrow("Only reply drafts");
  });
});
