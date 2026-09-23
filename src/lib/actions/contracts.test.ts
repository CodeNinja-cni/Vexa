import { describe, expect, it } from "vitest";

import {
  isActionRevisable,
  isActionReviewable,
  summarizeActions,
} from "@/lib/actions/contracts";
import { getDemoActionCenter } from "@/lib/fixtures/actions";

describe("Action Center contracts", () => {
  it("keeps the fixture dataset valid and honestly labelled", () => {
    const center = getDemoActionCenter();
    expect(center.mode).toBe("fixture");
    expect(center.actions).toHaveLength(3);
    expect(center.actions.every((action) => action.evidence.length > 0)).toBe(true);
    expect(center.actions.every((action) => action.versions.length > 0)).toBe(true);
  });

  it("allows reply revisions only from safe pre-execution states", () => {
    expect(isActionRevisable({ kind: "reply", status: "awaiting_approval" })).toBe(true);
    expect(isActionRevisable({ kind: "reply", status: "approved" })).toBe(true);
    expect(isActionRevisable({ kind: "reply", status: "succeeded" })).toBe(false);
    expect(isActionRevisable({ kind: "schedule", status: "awaiting_approval" })).toBe(false);
  });

  it("summarizes approval states", () => {
    expect(summarizeActions(getDemoActionCenter().actions)).toEqual({
      total: 3,
      awaitingApproval: 1,
      approved: 1,
      rejected: 1,
    });
  });

  it("allows decisions only while awaiting approval", () => {
    expect(isActionReviewable({ status: "awaiting_approval" })).toBe(true);
    expect(isActionReviewable({ status: "approved" })).toBe(false);
    expect(isActionReviewable({ status: "rejected" })).toBe(false);
  });
});
