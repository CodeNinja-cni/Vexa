import { z } from "zod";

export const approvalStatusSchema = z.enum([
  "recommended",
  "prepared",
  "awaiting_approval",
  "approved",
  "rejected",
  "expired",
  "executing",
  "succeeded",
  "failed",
]);

export const approvalCommandSchema = z.enum([
  "prepare",
  "request_approval",
  "approve",
  "edit",
  "reject",
  "expire",
  "execute",
  "succeed",
  "fail",
  "retry",
]);

export const actionAggregateSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().uuid(),
  status: approvalStatusSchema,
  payloadVersion: z.number().int().positive(),
  approvedPayloadVersion: z.number().int().positive().nullable(),
  executionAttempts: z.number().int().nonnegative(),
  hasSucceeded: z.boolean(),
});

export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type ApprovalCommand = z.infer<typeof approvalCommandSchema>;
export type ActionAggregate = z.infer<typeof actionAggregateSchema>;

export class ApprovalTransitionError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid_transition"
      | "approval_stale"
      | "duplicate_execution",
  ) {
    super(message);
    this.name = "ApprovalTransitionError";
  }
}

const allowedTransitions: Partial<
  Record<ApprovalStatus, Partial<Record<ApprovalCommand, ApprovalStatus>>>
> = {
  recommended: { prepare: "prepared" },
  prepared: { request_approval: "awaiting_approval", edit: "prepared" },
  awaiting_approval: {
    approve: "approved",
    edit: "prepared",
    reject: "rejected",
    expire: "expired",
  },
  approved: { edit: "prepared", execute: "executing", expire: "expired" },
  failed: { edit: "prepared", retry: "executing" },
  executing: { succeed: "succeeded", fail: "failed" },
};

export function transitionAction(
  aggregate: ActionAggregate,
  command: ApprovalCommand,
): ActionAggregate {
  const current = actionAggregateSchema.parse(aggregate);
  const nextStatus = allowedTransitions[current.status]?.[command];

  if (!nextStatus) {
    throw new ApprovalTransitionError(
      `Cannot ${command} an action in the ${current.status} state.`,
      "invalid_transition",
    );
  }

  if ((command === "execute" || command === "retry") && current.hasSucceeded) {
    throw new ApprovalTransitionError(
      "A successful action cannot be executed again.",
      "duplicate_execution",
    );
  }

  if (
    command === "execute" &&
    current.approvedPayloadVersion !== current.payloadVersion
  ) {
    throw new ApprovalTransitionError(
      "The approved payload is stale and must be approved again.",
      "approval_stale",
    );
  }

  const edited = command === "edit";
  const approved = command === "approve";
  const executing = command === "execute" || command === "retry";

  return {
    ...current,
    status: nextStatus,
    payloadVersion: edited ? current.payloadVersion + 1 : current.payloadVersion,
    approvedPayloadVersion: edited
      ? null
      : approved
        ? current.payloadVersion
        : current.approvedPayloadVersion,
    executionAttempts: executing
      ? current.executionAttempts + 1
      : current.executionAttempts,
    hasSucceeded: command === "succeed" ? true : current.hasSucceeded,
  };
}
