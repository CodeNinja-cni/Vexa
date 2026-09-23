import { describe, expect, it } from "vitest";

import {
  ApprovalTransitionError,
  transitionAction,
  type ActionAggregate,
} from "@/lib/domain/approvals";

const baseAction: ActionAggregate = {
  id: "action-1",
  organizationId: "00000000-0000-4000-8000-000000000001",
  status: "recommended",
  payloadVersion: 1,
  approvedPayloadVersion: null,
  executionAttempts: 0,
  hasSucceeded: false,
};

describe("transitionAction", () => {
  it("moves an action through preparation, approval, execution, and success", () => {
    const prepared = transitionAction(baseAction, "prepare");
    const awaiting = transitionAction(prepared, "request_approval");
    const approved = transitionAction(awaiting, "approve");
    const executing = transitionAction(approved, "execute");
    const succeeded = transitionAction(executing, "succeed");

    expect(succeeded.status).toBe("succeeded");
    expect(succeeded.hasSucceeded).toBe(true);
    expect(succeeded.executionAttempts).toBe(1);
  });

  it("invalidates approval when the payload is edited", () => {
    const approved = transitionAction(
      transitionAction(transitionAction(baseAction, "prepare"), "request_approval"),
      "approve",
    );

    const edited = transitionAction(approved, "edit");

    expect(edited.status).toBe("prepared");
    expect(edited.payloadVersion).toBe(2);
    expect(edited.approvedPayloadVersion).toBeNull();
  });

  it("rejects execution with stale approval", () => {
    expect(() =>
      transitionAction(
        {
          ...baseAction,
          status: "approved",
          payloadVersion: 2,
          approvedPayloadVersion: 1,
        },
        "execute",
      ),
    ).toThrowError(ApprovalTransitionError);
  });

  it("prevents a successful action from being retried", () => {
    expect(() =>
      transitionAction(
        {
          ...baseAction,
          status: "failed",
          approvedPayloadVersion: 1,
          hasSucceeded: true,
        },
        "retry",
      ),
    ).toThrow("cannot be executed again");
  });
});
