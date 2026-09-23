import { and, eq, isNull } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import {
  approvalRequests,
  actionPayloadVersions,
  auditEvents,
  executionRecords,
  suggestedActions,
} from "@/lib/db/schema";
import {
  type ApprovalCommand,
  ApprovalTransitionError,
  transitionAction,
} from "@/lib/domain/approvals";
import {
  buildRevisedReplyPayload,
  type ReplyRevisionInput,
} from "@/lib/actions/revisions";

export class ActionNotFoundError extends Error {
  constructor() {
    super("The action was not found in this workspace.");
    this.name = "ActionNotFoundError";
  }
}

export async function revisePersistedReply(
  principal: Principal,
  actionId: string,
  revision: ReplyRevisionInput,
  correlationId: string,
) {
  const db = getDatabase();
  const [action] = await db
    .select()
    .from(suggestedActions)
    .where(
      and(
        eq(suggestedActions.id, actionId),
        eq(suggestedActions.organizationId, principal.organizationId),
        eq(suggestedActions.userId, principal.userId),
      ),
    )
    .limit(1);

  if (!action) throw new ActionNotFoundError();
  if (action.expiresAt && action.expiresAt.getTime() <= Date.now()) {
    throw new ApprovalTransitionError(
      "This action has expired and must be prepared again.",
      "invalid_transition",
    );
  }

  const aggregate = {
    id: action.id,
    organizationId: action.organizationId,
    status: action.status,
    payloadVersion: action.payloadVersion,
    approvedPayloadVersion: action.approvedPayloadVersion,
    executionAttempts: 0,
    hasSucceeded: false,
  };
  const edited = transitionAction(aggregate, "edit");
  const requested = transitionAction(edited, "request_approval");
  const payload = buildRevisedReplyPayload(action, revision);
  const now = new Date();

  return db.transaction(async (transaction) => {
    const [updated] = await transaction
      .update(suggestedActions)
      .set({
        status: requested.status,
        payload,
        payloadVersion: requested.payloadVersion,
        approvedPayloadVersion: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(suggestedActions.id, action.id),
          eq(suggestedActions.organizationId, principal.organizationId),
          eq(suggestedActions.userId, principal.userId),
          eq(suggestedActions.payloadVersion, action.payloadVersion),
        ),
      )
      .returning({
        id: suggestedActions.id,
        status: suggestedActions.status,
        payload: suggestedActions.payload,
        payloadVersion: suggestedActions.payloadVersion,
        approvedPayloadVersion: suggestedActions.approvedPayloadVersion,
        expiresAt: suggestedActions.expiresAt,
      });

    if (!updated) {
      throw new ApprovalTransitionError(
        "The draft changed while it was being edited. Reload it and try again.",
        "approval_stale",
      );
    }

    await transaction
      .update(approvalRequests)
      .set({
        decision: "invalidated",
        decidedByUserId: principal.userId,
        decidedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(approvalRequests.organizationId, principal.organizationId),
          eq(approvalRequests.actionId, action.id),
          eq(approvalRequests.payloadVersion, action.payloadVersion),
          isNull(approvalRequests.decision),
        ),
      );

    await transaction.insert(actionPayloadVersions).values({
      organizationId: principal.organizationId,
      actionId: action.id,
      payloadVersion: requested.payloadVersion,
      payload,
      createdByUserId: principal.userId,
      changeSummary: "User edited the reply and requested approval again",
      createdAt: now,
    });

    await transaction.insert(approvalRequests).values({
      organizationId: principal.organizationId,
      actionId: action.id,
      payloadVersion: requested.payloadVersion,
      createdAt: now,
      updatedAt: now,
    });

    await transaction.insert(auditEvents).values([
      {
        organizationId: principal.organizationId,
        actorUserId: principal.userId,
        eventType: "action.edit",
        subjectType: "suggested_action",
        subjectId: action.id,
        correlationId,
        details: {
          previousStatus: action.status,
          nextStatus: edited.status,
          previousPayloadVersion: action.payloadVersion,
          payloadVersion: edited.payloadVersion,
          approvalInvalidated: action.approvedPayloadVersion !== null,
        },
        createdAt: now,
      },
      {
        organizationId: principal.organizationId,
        actorUserId: principal.userId,
        eventType: "action.request_approval",
        subjectType: "suggested_action",
        subjectId: action.id,
        correlationId,
        details: {
          previousStatus: edited.status,
          nextStatus: requested.status,
          payloadVersion: requested.payloadVersion,
        },
        createdAt: now,
      },
    ]);

    return {
      ...updated,
      expiresAt: updated.expiresAt?.toISOString(),
    };
  });
}

export async function transitionPersistedAction(
  principal: Principal,
  actionId: string,
  command: ApprovalCommand,
  correlationId: string,
  editedPayload?: Record<string, unknown>,
) {
  const db = getDatabase();
  const [action] = await db
    .select()
    .from(suggestedActions)
    .where(
      and(
        eq(suggestedActions.id, actionId),
        eq(suggestedActions.organizationId, principal.organizationId),
        eq(suggestedActions.userId, principal.userId),
      ),
    )
    .limit(1);

  if (!action) throw new ActionNotFoundError();
  if (action.expiresAt && action.expiresAt.getTime() <= Date.now()) {
    throw new ApprovalTransitionError(
      "This action has expired and must be prepared again.",
      "invalid_transition",
    );
  }
  if (command === "edit" && !editedPayload) {
    throw new ApprovalTransitionError(
      "An edited payload is required when editing an action.",
      "invalid_transition",
    );
  }

  const executions = await db
    .select({ status: executionRecords.status })
    .from(executionRecords)
    .where(
      and(
        eq(executionRecords.organizationId, principal.organizationId),
        eq(executionRecords.actionId, action.id),
      ),
    );
  const next = transitionAction(
    {
      id: action.id,
      organizationId: action.organizationId,
      status: action.status,
      payloadVersion: action.payloadVersion,
      approvedPayloadVersion: action.approvedPayloadVersion,
      executionAttempts: executions.length,
      hasSucceeded: executions.some((record) => record.status === "succeeded"),
    },
    command,
  );

  return db.transaction(async (transaction) => {
    const [updated] = await transaction
      .update(suggestedActions)
      .set({
        status: next.status,
        payload: editedPayload ?? action.payload,
        payloadVersion: next.payloadVersion,
        approvedPayloadVersion: next.approvedPayloadVersion,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(suggestedActions.id, action.id),
          eq(suggestedActions.organizationId, principal.organizationId),
          eq(suggestedActions.payloadVersion, action.payloadVersion),
        ),
      )
      .returning({
        id: suggestedActions.id,
        status: suggestedActions.status,
        payload: suggestedActions.payload,
        payloadVersion: suggestedActions.payloadVersion,
        approvedPayloadVersion: suggestedActions.approvedPayloadVersion,
        expiresAt: suggestedActions.expiresAt,
      });

    if (!updated) {
      throw new ApprovalTransitionError(
        "The action changed while it was being reviewed. Reload and review it again.",
        "approval_stale",
      );
    }

    if (command === "approve" || command === "reject") {
      await transaction
        .update(approvalRequests)
        .set({
          decision: command === "approve" ? "approved" : "rejected",
          decidedByUserId: principal.userId,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(approvalRequests.organizationId, principal.organizationId),
            eq(approvalRequests.actionId, action.id),
            eq(approvalRequests.payloadVersion, action.payloadVersion),
          ),
        );
    }

    if (command === "edit") {
      await transaction.insert(actionPayloadVersions).values({
        organizationId: principal.organizationId,
        actionId: action.id,
        payloadVersion: next.payloadVersion,
        payload: editedPayload ?? action.payload,
        createdByUserId: principal.userId,
        changeSummary: "Payload edited",
      });
    }

    if (command === "request_approval") {
      await transaction.insert(approvalRequests).values({
        organizationId: principal.organizationId,
        actionId: action.id,
        payloadVersion: next.payloadVersion,
      });
    }

    await transaction.insert(auditEvents).values({
      organizationId: principal.organizationId,
      actorUserId: principal.userId,
      eventType: `action.${command}`,
      subjectType: "suggested_action",
      subjectId: action.id,
      correlationId,
      details: {
        previousStatus: action.status,
        nextStatus: next.status,
        payloadVersion: next.payloadVersion,
      },
    });

    return {
      ...updated,
      expiresAt: updated.expiresAt?.toISOString(),
    };
  });
}
