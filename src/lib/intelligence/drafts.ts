import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";

import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import {
  actionEvidence,
  actionPayloadVersions,
  approvalRequests,
  auditEvents,
  sourceRecords,
  suggestedActions,
} from "@/lib/db/schema";
import {
  prepareDeterministicReply,
  type EvidenceRecord,
  type GroundedDraft,
} from "@/lib/intelligence/grounding";

export class EvidenceAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceAccessError";
  }
}

export interface PreparedReplyAction {
  id: string;
  status: "awaiting_approval";
  payloadVersion: number;
  expiresAt: string;
  draft: GroundedDraft;
}

export async function retrieveEvidence(
  principal: Principal,
  sourceRecordIds: string[],
): Promise<EvidenceRecord[]> {
  const uniqueIds = [...new Set(sourceRecordIds)];
  if (uniqueIds.length === 0 || uniqueIds.length > 10) {
    throw new EvidenceAccessError("Select between one and ten evidence records.");
  }

  const rows = await getDatabase()
    .select({
      id: sourceRecords.id,
      sourceType: sourceRecords.sourceType,
      title: sourceRecords.title,
      body: sourceRecords.body,
      sourceUrl: sourceRecords.sourceUrl,
      occurredAt: sourceRecords.occurredAt,
      metadata: sourceRecords.rawPayload,
    })
    .from(sourceRecords)
    .where(
      and(
        eq(sourceRecords.organizationId, principal.organizationId),
        inArray(sourceRecords.id, uniqueIds),
      ),
    );

  if (rows.length !== uniqueIds.length) {
    throw new EvidenceAccessError(
      "One or more evidence records were unavailable in this workspace.",
    );
  }

  const order = new Map(uniqueIds.map((id, index) => [id, index]));
  return rows.sort(
    (left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0),
  );
}

export async function createPreparedReply(
  principal: Principal,
  sourceRecordIds: string[],
  instruction?: string,
  correlationId: string = randomUUID(),
): Promise<PreparedReplyAction> {
  const evidence = await retrieveEvidence(principal, sourceRecordIds);
  const draft = prepareDeterministicReply(evidence, instruction);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const payload = {
    type: "gmail.reply.draft",
    subject: draft.subject,
    body: draft.body,
    destination: draft.destination,
    groundingMode: draft.groundingMode,
    sourceRecordIds: draft.evidence.map((item) => item.sourceRecordId),
    evidence: draft.evidence,
  };

  const action = await getDatabase().transaction(async (transaction) => {
    const [created] = await transaction
      .insert(suggestedActions)
      .values({
        organizationId: principal.organizationId,
        userId: principal.userId,
        kind: "reply",
        label: "Review grounded Gmail reply",
        destination: draft.destination,
        payload,
        payloadVersion: 1,
        status: "awaiting_approval",
        expiresAt,
      })
      .returning({ id: suggestedActions.id });

    await transaction.insert(actionEvidence).values(
      draft.evidence.map((item) => ({
        organizationId: principal.organizationId,
        actionId: created.id,
        sourceRecordId: item.sourceRecordId,
        excerpt: item.excerpt,
      })),
    );

    await transaction.insert(actionPayloadVersions).values({
      organizationId: principal.organizationId,
      actionId: created.id,
      payloadVersion: 1,
      payload,
      createdByUserId: principal.userId,
      changeSummary: "Initial grounded draft",
    });

    await transaction.insert(approvalRequests).values({
      organizationId: principal.organizationId,
      actionId: created.id,
      payloadVersion: 1,
    });

    await transaction.insert(auditEvents).values({
      organizationId: principal.organizationId,
      actorUserId: principal.userId,
      eventType: "action.prepared_for_approval",
      subjectType: "suggested_action",
      subjectId: created.id,
      correlationId,
      details: {
        kind: "reply",
        groundingMode: draft.groundingMode,
        sourceRecordIds: payload.sourceRecordIds,
      },
    });

    return created;
  });

  return {
    id: action.id,
    status: "awaiting_approval",
    payloadVersion: 1,
    expiresAt: expiresAt.toISOString(),
    draft,
  };
}
