import type { BriefingItem } from "@/lib/domain/models";

export const briefingItems: BriefingItem[] = [
  {
    id: "brief-1",
    category: "work",
    urgency: "high",
    title: "Two decisions are blocking the launch review",
    summary:
      "The API ownership question and the final demo scope are still unresolved. Both are referenced in today's 2:00 PM review.",
    rationale: "Resolving these before the meeting prevents another delivery slip.",
    dueLabel: "Before 2:00 PM",
    citations: [
      {
        id: "cite-1",
        integration: "Google Calendar",
        sourceType: "event",
        sourceLabel: "Vexa launch review",
        observedAt: "2026-09-18T08:10:00.000Z",
      },
      {
        id: "cite-2",
        integration: "Gmail",
        sourceType: "thread",
        sourceLabel: "Re: API ownership and demo scope",
        observedAt: "2026-09-18T08:42:00.000Z",
      },
    ],
    action: {
      id: "action-1",
      kind: "reply",
      label: "Prepare a decision request",
      destination: "Gmail thread",
      status: "recommended",
    },
  },
  {
    id: "brief-2",
    category: "work",
    urgency: "normal",
    title: "Three messages are waiting for your response",
    summary:
      "One customer question, one design review, and one team update have had no reply for more than 18 hours.",
    rationale: "The customer question has the highest relationship impact.",
    dueLabel: "18–26 hours old",
    citations: [
      {
        id: "cite-3",
        integration: "Gmail",
        sourceType: "message",
        sourceLabel: "Integration availability question",
        observedAt: "2026-09-17T10:16:00.000Z",
      },
    ],
    action: {
      id: "action-2",
      kind: "reply",
      label: "Draft replies",
      destination: "Gmail",
      status: "recommended",
    },
  },
  {
    id: "brief-3",
    category: "news",
    urgency: "normal",
    title: "A competitor announced approval-based AI actions",
    summary:
      "The announcement overlaps with Vexa's core trust position. The strongest differentiation remains cross-source evidence and transparent permission controls.",
    rationale: "This may affect the wording used in the product narrative.",
    dueLabel: "Published 1 hour ago",
    citations: [
      {
        id: "cite-4",
        integration: "News feed",
        sourceType: "article",
        sourceLabel: "Enterprise assistants add human approval gates",
        sourceUrl: "https://example.com/vexa-demo-news",
        observedAt: "2026-09-18T09:05:00.000Z",
      },
    ],
    action: {
      id: "action-3",
      kind: "review",
      label: "Review positioning",
      destination: "Vexa product narrative",
      status: "recommended",
    },
  },
];

export const schedule = [
  { time: "10:00", title: "Engineering stand-up", meta: "Google Meet · 25 min" },
  { time: "12:30", title: "Design handoff", meta: "Figma review · 45 min" },
  { time: "14:00", title: "Vexa launch review", meta: "Google Meet · 60 min" },
];
