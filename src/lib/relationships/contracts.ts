import { z } from "zod";

export const relationshipSignalSchema = z.enum([
  "needs_reply",
  "waiting",
  "opportunity",
  "active",
]);

export const relationshipEvidenceSchema = z.object({
  sourceRecordId: z.string(),
  sourceLabel: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().url().optional(),
  occurredAt: z.string().datetime(),
  direction: z.enum(["inbound", "outbound"]),
});

export const relationshipCommitmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  status: z.enum(["open", "due", "waiting"]),
  sourceRecordId: z.string(),
  sourceLabel: z.string(),
  occurredAt: z.string().datetime(),
});

export const relationshipPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  initials: z.string(),
  channel: z.string(),
  signal: relationshipSignalSchema,
  score: z.number().int().min(0).max(100),
  detail: z.string(),
  lastContactAt: z.string().datetime(),
  messageCount: z.number().int().positive(),
  inboundCount: z.number().int().nonnegative(),
  outboundCount: z.number().int().nonnegative(),
  evidence: z.array(relationshipEvidenceSchema),
  commitments: z.array(relationshipCommitmentSchema),
});

export const relationshipsResponseSchema = z.object({
  mode: z.enum(["live", "fixture"]),
  generatedAt: z.string().datetime(),
  completenessWarning: z.string().optional(),
  people: z.array(relationshipPersonSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    followUps: z.number().int().nonnegative(),
    opportunities: z.number().int().nonnegative(),
    commitments: z.number().int().nonnegative(),
  }),
});

export type RelationshipSignal = z.infer<typeof relationshipSignalSchema>;
export type RelationshipEvidence = z.infer<typeof relationshipEvidenceSchema>;
export type RelationshipCommitment = z.infer<typeof relationshipCommitmentSchema>;
export type RelationshipPerson = z.infer<typeof relationshipPersonSchema>;
export type RelationshipsResponse = z.infer<typeof relationshipsResponseSchema>;

export function summarizeRelationships(
  people: RelationshipPerson[],
): RelationshipsResponse["summary"] {
  return {
    total: people.length,
    followUps: people.filter((person) =>
      ["needs_reply", "waiting"].includes(person.signal),
    ).length,
    opportunities: people.filter((person) => person.signal === "opportunity").length,
    commitments: people.reduce(
      (total, person) => total + person.commitments.length,
      0,
    ),
  };
}
