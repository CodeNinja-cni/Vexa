import { z } from "zod";

import { approvalStatusSchema } from "@/lib/domain/approvals";

export const actionEvidenceItemSchema = z.object({
  sourceRecordId: z.string(),
  integration: z.string(),
  sourceType: z.string(),
  sourceLabel: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().url().optional(),
  observedAt: z.string().datetime(),
});

export const actionTimelineItemSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  label: z.string(),
  at: z.string().datetime(),
  correlationId: z.string(),
  details: z.record(z.string(), z.unknown()),
});

export const actionApprovalItemSchema = z.object({
  id: z.string(),
  payloadVersion: z.number().int().positive(),
  decision: z.string().nullable(),
  decidedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const actionExecutionItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  providerReference: z.string().nullable(),
  error: z.string().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export const actionPayloadVersionItemSchema = z.object({
  payloadVersion: z.number().int().positive(),
  payload: z.record(z.string(), z.unknown()),
  changeSummary: z.string(),
  createdAt: z.string().datetime(),
});

export const actionCenterItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
  destination: z.string(),
  payload: z.record(z.string(), z.unknown()),
  payloadVersion: z.number().int().positive(),
  approvedPayloadVersion: z.number().int().positive().nullable(),
  status: approvalStatusSchema,
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  evidence: z.array(actionEvidenceItemSchema),
  versions: z.array(actionPayloadVersionItemSchema).min(1),
  approvals: z.array(actionApprovalItemSchema),
  executions: z.array(actionExecutionItemSchema),
  timeline: z.array(actionTimelineItemSchema),
});

export const actionCenterResponseSchema = z.object({
  mode: z.enum(["live", "fixture"]),
  generatedAt: z.string().datetime(),
  actions: z.array(actionCenterItemSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    awaitingApproval: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
  }),
});

export type ActionCenterItem = z.infer<typeof actionCenterItemSchema>;
export type ActionCenterResponse = z.infer<typeof actionCenterResponseSchema>;

export function summarizeActions(
  actions: Array<Pick<ActionCenterItem, "status">>,
): ActionCenterResponse["summary"] {
  return {
    total: actions.length,
    awaitingApproval: actions.filter((action) => action.status === "awaiting_approval").length,
    approved: actions.filter((action) => action.status === "approved").length,
    rejected: actions.filter((action) => action.status === "rejected").length,
  };
}

export function isActionReviewable(action: Pick<ActionCenterItem, "status">): boolean {
  return action.status === "awaiting_approval";
}

export function isActionRevisable(action: Pick<ActionCenterItem, "kind" | "status">): boolean {
  return (
    action.kind === "reply" &&
    ["prepared", "awaiting_approval", "approved", "failed"].includes(action.status)
  );
}
