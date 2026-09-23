import {
  relationshipsResponseSchema,
  summarizeRelationships,
  type RelationshipPerson,
  type RelationshipsResponse,
} from "@/lib/relationships/contracts";

const people: RelationshipPerson[] = [
  {
    id: "demo-amara",
    name: "Amara Mensah",
    email: "amara@atlas.example",
    initials: "AM",
    channel: "Gmail · demo",
    signal: "opportunity",
    score: 96,
    detail: "Amara's recent messages contain a partnership and pilot-market signal for Atlas Labs.",
    lastContactAt: "2026-09-20T10:52:00.000Z",
    messageCount: 3,
    inboundCount: 2,
    outboundCount: 1,
    evidence: [
      {
        sourceRecordId: "demo-inbox-atlas",
        sourceLabel: "Re: Atlas partnership scope",
        excerpt: "The revised proposal looks strong. Can we confirm the pilot markets before Friday?",
        occurredAt: "2026-09-20T10:52:00.000Z",
        direction: "inbound",
      },
      {
        sourceRecordId: "demo-atlas-proposal",
        sourceLabel: "Atlas pilot proposal",
        excerpt: "Sharing the revised rollout and commercial assumptions.",
        occurredAt: "2026-09-18T14:15:00.000Z",
        direction: "outbound",
      },
    ],
    commitments: [
      {
        id: "demo-commitment-atlas",
        title: "Respond to Re: Atlas partnership scope",
        summary: "Confirm the proposed Nigeria and Kenya pilot markets before Friday.",
        status: "open",
        sourceRecordId: "demo-inbox-atlas",
        sourceLabel: "Re: Atlas partnership scope",
        occurredAt: "2026-09-20T10:52:00.000Z",
      },
    ],
  },
  {
    id: "demo-david",
    name: "David Kim",
    email: "david@example.com",
    initials: "DK",
    channel: "Gmail · demo",
    signal: "needs_reply",
    score: 92,
    detail: "David's latest message contains an ownership decision that may need your response.",
    lastContactAt: "2026-09-20T10:36:00.000Z",
    messageCount: 4,
    inboundCount: 3,
    outboundCount: 1,
    evidence: [
      {
        sourceRecordId: "demo-inbox-launch",
        sourceLabel: "Launch review blockers",
        excerpt: "I need a final owner for the API handoff before the 2 PM review.",
        occurredAt: "2026-09-20T10:36:00.000Z",
        direction: "inbound",
      },
    ],
    commitments: [
      {
        id: "demo-commitment-launch",
        title: "Respond to Launch review blockers",
        summary: "Assign a final owner for the API handoff before the review.",
        status: "open",
        sourceRecordId: "demo-inbox-launch",
        sourceLabel: "Launch review blockers",
        occurredAt: "2026-09-20T10:36:00.000Z",
      },
    ],
  },
  {
    id: "demo-tunde",
    name: "Tunde Kale",
    email: "tunde@northstar.example",
    initials: "TK",
    channel: "Gmail · demo",
    signal: "waiting",
    score: 69,
    detail: "Your latest exchange with Tunde was outbound, so this relationship may be waiting on them.",
    lastContactAt: "2026-09-19T16:20:00.000Z",
    messageCount: 2,
    inboundCount: 1,
    outboundCount: 1,
    evidence: [
      {
        sourceRecordId: "demo-inbox-followup",
        sourceLabel: "Security overview follow-up",
        excerpt: "Sharing the promised overview after Tuesday's call.",
        occurredAt: "2026-09-19T16:20:00.000Z",
        direction: "outbound",
      },
    ],
    commitments: [
      {
        id: "demo-commitment-security",
        title: "Follow up on Security overview",
        summary: "Check whether Tunde has questions about the promised security overview.",
        status: "waiting",
        sourceRecordId: "demo-inbox-followup",
        sourceLabel: "Security overview follow-up",
        occurredAt: "2026-09-19T16:20:00.000Z",
      },
    ],
  },
  {
    id: "demo-maya",
    name: "Maya Thompson",
    email: "maya@example.com",
    initials: "MT",
    channel: "Gmail · demo",
    signal: "active",
    score: 53,
    detail: "Two inbound and one outbound recent Gmail messages provide the current context.",
    lastContactAt: "2026-09-20T07:15:00.000Z",
    messageCount: 3,
    inboundCount: 2,
    outboundCount: 1,
    evidence: [
      {
        sourceRecordId: "demo-inbox-design",
        sourceLabel: "Design system handoff",
        excerpt: "The final interaction notes are ready for your sign-off.",
        occurredAt: "2026-09-20T07:15:00.000Z",
        direction: "inbound",
      },
    ],
    commitments: [],
  },
];

export function getDemoRelationships(): RelationshipsResponse {
  return relationshipsResponseSchema.parse({
    mode: "fixture",
    generatedAt: "2026-09-20T12:00:00.000Z",
    completenessWarning:
      "Demonstration relationship memory. Connect and sync Google to derive people and commitments from authorized Gmail metadata.",
    people: structuredClone(people),
    summary: summarizeRelationships(people),
  });
}
