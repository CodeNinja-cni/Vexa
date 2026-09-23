import { ApprovalTransitionError } from "@/lib/domain/approvals";

export interface ReplyRevisionInput {
  subject?: string;
  body: string;
}

export function buildRevisedReplyPayload(
  action: { kind: string; payload: Record<string, unknown> },
  revision: ReplyRevisionInput,
): Record<string, unknown> {
  if (action.kind !== "reply") {
    throw new ApprovalTransitionError(
      "Only reply drafts can be edited in the current pilot.",
      "invalid_transition",
    );
  }

  const body = revision.body.trim();
  const subject = revision.subject?.trim();
  if (body.length === 0 || body.length > 10_000) {
    throw new ApprovalTransitionError(
      "The reply body must contain between 1 and 10,000 characters.",
      "invalid_transition",
    );
  }
  if (subject && subject.length > 300) {
    throw new ApprovalTransitionError(
      "The reply subject must contain no more than 300 characters.",
      "invalid_transition",
    );
  }

  return {
    ...action.payload,
    ...(subject !== undefined ? { subject } : {}),
    body,
  };
}
