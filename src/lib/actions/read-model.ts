import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import {
  actionCenterResponseSchema,
  summarizeActions,
  type ActionCenterResponse,
} from "@/lib/actions/contracts";
import type { Principal } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import {
  actionEvidence,
  actionPayloadVersions,
  approvalRequests,
  auditEvents,
  executionRecords,
  integrations,
  sourceRecords,
  suggestedActions,
} from "@/lib/db/schema";

function integrationLabel(sourceType: string, provider: string): string {
  if (sourceType === "gmail-message") return "Gmail";
  if (sourceType === "calendar-event") return "Google Calendar";
  if (provider === "google") return "Google Workspace";
  return provider;
}

function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    "action.prepared_for_approval": "Grounded draft prepared for review",
    "action.prepare": "Action payload prepared",
    "action.request_approval": "Approval requested",
    "action.approve": "Exact payload approved",
    "action.reject": "Draft rejected without execution",
    "action.edit": "Payload edited; previous approval invalidated",
    "action.expire": "Action expired",
  };
  return labels[eventType] ?? eventType.replaceAll("_", " ").replace("action.", "Action ");
}

export async function getActionCenter(
  principal: Principal,
): Promise<ActionCenterResponse> {
  const db = getDatabase();
  const actions = await db
    .select({
      id: suggestedActions.id,
      kind: suggestedActions.kind,
      label: suggestedActions.label,
      destination: suggestedActions.destination,
      payload: suggestedActions.payload,
      payloadVersion: suggestedActions.payloadVersion,
      approvedPayloadVersion: suggestedActions.approvedPayloadVersion,
      status: suggestedActions.status,
      expiresAt: suggestedActions.expiresAt,
      createdAt: suggestedActions.createdAt,
      updatedAt: suggestedActions.updatedAt,
    })
    .from(suggestedActions)
    .where(
      and(
        eq(suggestedActions.organizationId, principal.organizationId),
        eq(suggestedActions.userId, principal.userId),
      ),
    )
    .orderBy(desc(suggestedActions.updatedAt))
    .limit(50);

  if (actions.length === 0) {
    return actionCenterResponseSchema.parse({
      mode: "live",
      generatedAt: new Date().toISOString(),
      actions: [],
      summary: summarizeActions([]),
    });
  }

  const actionIds = actions.map((action) => action.id);
  const [evidenceRows, versionRows, approvalRows, executionRows, auditRows] = await Promise.all([
    db
      .select({
        actionId: actionEvidence.actionId,
        sourceRecordId: actionEvidence.sourceRecordId,
        excerpt: actionEvidence.excerpt,
        provider: integrations.provider,
        sourceType: sourceRecords.sourceType,
        sourceLabel: sourceRecords.title,
        sourceUrl: sourceRecords.sourceUrl,
        observedAt: sourceRecords.occurredAt,
      })
      .from(actionEvidence)
      .innerJoin(sourceRecords, eq(sourceRecords.id, actionEvidence.sourceRecordId))
      .innerJoin(integrations, eq(integrations.id, sourceRecords.integrationId))
      .where(
        and(
          eq(actionEvidence.organizationId, principal.organizationId),
          eq(sourceRecords.organizationId, principal.organizationId),
          eq(integrations.organizationId, principal.organizationId),
          eq(integrations.ownerUserId, principal.userId),
          inArray(actionEvidence.actionId, actionIds),
        ),
      ),
    db
      .select()
      .from(actionPayloadVersions)
      .where(
        and(
          eq(actionPayloadVersions.organizationId, principal.organizationId),
          inArray(actionPayloadVersions.actionId, actionIds),
        ),
      )
      .orderBy(desc(actionPayloadVersions.payloadVersion)),
    db
      .select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.organizationId, principal.organizationId),
          inArray(approvalRequests.actionId, actionIds),
        ),
      )
      .orderBy(desc(approvalRequests.createdAt)),
    db
      .select()
      .from(executionRecords)
      .where(
        and(
          eq(executionRecords.organizationId, principal.organizationId),
          inArray(executionRecords.actionId, actionIds),
        ),
      )
      .orderBy(desc(executionRecords.startedAt)),
    db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.organizationId, principal.organizationId),
          eq(auditEvents.subjectType, "suggested_action"),
          inArray(auditEvents.subjectId, actionIds),
        ),
      )
      .orderBy(desc(auditEvents.createdAt)),
  ]);

  const hydrated = actions.map((action) => ({
    ...action,
    expiresAt: action.expiresAt?.toISOString(),
    createdAt: action.createdAt.toISOString(),
    updatedAt: action.updatedAt.toISOString(),
    evidence: evidenceRows
      .filter((row) => row.actionId === action.id)
      .map((row) => ({
        sourceRecordId: row.sourceRecordId,
        integration: integrationLabel(row.sourceType, row.provider),
        sourceType: row.sourceType,
        sourceLabel: row.sourceLabel,
        excerpt: row.excerpt,
        sourceUrl: row.sourceUrl ?? undefined,
        observedAt: row.observedAt.toISOString(),
      })),
    versions: versionRows
      .filter((row) => row.actionId === action.id)
      .map((row) => ({
        payloadVersion: row.payloadVersion,
        payload: row.payload,
        changeSummary: row.changeSummary,
        createdAt: row.createdAt.toISOString(),
      })),
    approvals: approvalRows
      .filter((row) => row.actionId === action.id)
      .map((row) => ({
        id: row.id,
        payloadVersion: row.payloadVersion,
        decision: row.decision,
        decidedAt: row.decidedAt?.toISOString(),
        createdAt: row.createdAt.toISOString(),
      })),
    executions: executionRows
      .filter((row) => row.actionId === action.id)
      .map((row) => ({
        id: row.id,
        status: row.status,
        providerReference: row.providerReference,
        error: row.error,
        startedAt: row.startedAt.toISOString(),
        completedAt: row.completedAt?.toISOString(),
      })),
    timeline: auditRows
      .filter((row) => row.subjectId === action.id)
      .map((row) => ({
        id: row.id,
        eventType: row.eventType,
        label: eventLabel(row.eventType),
        at: row.createdAt.toISOString(),
        correlationId: row.correlationId,
        details: row.details,
      })),
  }));

  return actionCenterResponseSchema.parse({
    mode: "live",
    generatedAt: new Date().toISOString(),
    actions: hydrated,
    summary: summarizeActions(hydrated),
  });
}
