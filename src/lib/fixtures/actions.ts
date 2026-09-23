import {
  actionCenterResponseSchema,
  summarizeActions,
  type ActionCenterItem,
  type ActionCenterResponse,
} from "@/lib/actions/contracts";

const demoActions: ActionCenterItem[] = [
  {
    id: "demo-action-atlas",
    kind: "reply",
    label: "Confirm Atlas pilot markets",
    destination: "Gmail · Amara Mensah",
    payload: {
      type: "gmail.reply.draft",
      subject: "Re: Atlas partnership scope",
      body: "Hi Amara,\n\nWe’re aligned on Nigeria and Kenya for the pilot, with Ghana as the next market. I’ll send the updated rollout note before Friday.\n\nBest,\nChidi",
      groundingMode: "deterministic",
    },
    payloadVersion: 1,
    approvedPayloadVersion: null,
    status: "awaiting_approval",
    expiresAt: "2026-09-21T18:00:00.000Z",
    createdAt: "2026-09-20T09:12:00.000Z",
    updatedAt: "2026-09-20T09:12:00.000Z",
    evidence: [
      {
        sourceRecordId: "demo-source-atlas",
        integration: "Gmail",
        sourceType: "gmail-message",
        sourceLabel: "Re: Atlas partnership scope",
        excerpt: "The revised proposal looks strong. Can we confirm the pilot markets before Friday?",
        observedAt: "2026-09-20T09:04:00.000Z",
      },
    ],
    versions: [
      {
        payloadVersion: 1,
        payload: {
          type: "gmail.reply.draft",
          subject: "Re: Atlas partnership scope",
          body: "Hi Amara,\n\nWe’re aligned on Nigeria and Kenya for the pilot, with Ghana as the next market. I’ll send the updated rollout note before Friday.\n\nBest,\nChidi",
          groundingMode: "deterministic",
        },
        changeSummary: "Initial grounded draft",
        createdAt: "2026-09-20T09:12:00.000Z",
      },
    ],
    approvals: [
      {
        id: "demo-approval-atlas",
        payloadVersion: 1,
        decision: null,
        createdAt: "2026-09-20T09:12:00.000Z",
      },
    ],
    executions: [],
    timeline: [
      {
        id: "demo-timeline-atlas",
        eventType: "action.prepared_for_approval",
        label: "Grounded draft prepared for review",
        at: "2026-09-20T09:12:00.000Z",
        correlationId: "demo-correlation-atlas",
        details: { groundingMode: "deterministic", sourceCount: 1 },
      },
    ],
  },
  {
    id: "demo-action-owner",
    kind: "reply",
    label: "Assign API handoff owner",
    destination: "Gmail · Launch review thread",
    payload: {
      type: "gmail.reply.draft",
      subject: "Re: API ownership and demo scope",
      body: "David owns the API handoff through the launch review. Maya will verify the interaction notes before the 2:00 PM checkpoint.",
      groundingMode: "deterministic",
    },
    payloadVersion: 1,
    approvedPayloadVersion: 1,
    status: "approved",
    expiresAt: "2026-09-21T14:00:00.000Z",
    createdAt: "2026-09-20T08:18:00.000Z",
    updatedAt: "2026-09-20T08:24:00.000Z",
    evidence: [
      {
        sourceRecordId: "demo-source-owner",
        integration: "Gmail",
        sourceType: "gmail-message",
        sourceLabel: "Re: API ownership and demo scope",
        excerpt: "A final owner is needed before the 2 PM launch review.",
        observedAt: "2026-09-20T08:02:00.000Z",
      },
    ],
    versions: [
      {
        payloadVersion: 1,
        payload: {
          type: "gmail.reply.draft",
          subject: "Re: API ownership and demo scope",
          body: "David owns the API handoff through the launch review. Maya will verify the interaction notes before the 2:00 PM checkpoint.",
          groundingMode: "deterministic",
        },
        changeSummary: "Initial grounded draft",
        createdAt: "2026-09-20T08:18:00.000Z",
      },
    ],
    approvals: [
      {
        id: "demo-approval-owner",
        payloadVersion: 1,
        decision: "approved",
        decidedAt: "2026-09-20T08:24:00.000Z",
        createdAt: "2026-09-20T08:18:00.000Z",
      },
    ],
    executions: [],
    timeline: [
      {
        id: "demo-timeline-owner-approved",
        eventType: "action.approve",
        label: "Exact payload approved",
        at: "2026-09-20T08:24:00.000Z",
        correlationId: "demo-correlation-owner",
        details: { previousStatus: "awaiting_approval", nextStatus: "approved", payloadVersion: 1 },
      },
      {
        id: "demo-timeline-owner-prepared",
        eventType: "action.prepared_for_approval",
        label: "Grounded draft prepared for review",
        at: "2026-09-20T08:18:00.000Z",
        correlationId: "demo-correlation-owner",
        details: { groundingMode: "deterministic", sourceCount: 1 },
      },
    ],
  },
  {
    id: "demo-action-panel",
    kind: "reply",
    label: "Respond to summit invitation",
    destination: "LinkedIn · Zainab Aliyu",
    payload: {
      type: "social.reply.demo",
      body: "Thank you for the invitation. I’m interested, but I need to confirm the session format and dates before committing.",
      groundingMode: "demo",
    },
    payloadVersion: 1,
    approvedPayloadVersion: null,
    status: "rejected",
    createdAt: "2026-09-19T16:40:00.000Z",
    updatedAt: "2026-09-19T16:45:00.000Z",
    evidence: [
      {
        sourceRecordId: "demo-source-panel",
        integration: "LinkedIn · demo",
        sourceType: "social-message",
        sourceLabel: "Africa Founders Summit invitation",
        excerpt: "Would you be open to joining our responsible AI panel next month?",
        observedAt: "2026-09-19T16:20:00.000Z",
      },
    ],
    versions: [
      {
        payloadVersion: 1,
        payload: {
          type: "social.reply.demo",
          body: "Thank you for the invitation. I’m interested, but I need to confirm the session format and dates before committing.",
          groundingMode: "demo",
        },
        changeSummary: "Initial demonstration draft",
        createdAt: "2026-09-19T16:40:00.000Z",
      },
    ],
    approvals: [
      {
        id: "demo-approval-panel",
        payloadVersion: 1,
        decision: "rejected",
        decidedAt: "2026-09-19T16:45:00.000Z",
        createdAt: "2026-09-19T16:40:00.000Z",
      },
    ],
    executions: [],
    timeline: [
      {
        id: "demo-timeline-panel",
        eventType: "action.reject",
        label: "Draft rejected without execution",
        at: "2026-09-19T16:45:00.000Z",
        correlationId: "demo-correlation-panel",
        details: { previousStatus: "awaiting_approval", nextStatus: "rejected" },
      },
    ],
  },
];

export function getDemoActionCenter(): ActionCenterResponse {
  return actionCenterResponseSchema.parse({
    mode: "fixture",
    generatedAt: "2026-09-20T10:00:00.000Z",
    actions: structuredClone(demoActions),
    summary: summarizeActions(demoActions),
  });
}
