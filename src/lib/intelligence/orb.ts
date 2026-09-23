import { z } from "zod";

export interface OrbEvidenceRecord {
  id: string;
  integration: string;
  sourceType: string;
  title: string;
  body: string;
  sourceUrl?: string;
  occurredAt: Date;
  metadata?: Record<string, unknown> | null;
}

export const orbCitationSchema = z.object({
  id: z.string(),
  sourceRecordId: z.string(),
  integration: z.string(),
  sourceType: z.string(),
  sourceLabel: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().url().optional(),
  observedAt: z.string().datetime(),
});

export const orbAnswerSchema = z.object({
  mode: z.enum(["live", "fixture"]),
  query: z.string(),
  answer: z.string(),
  confidence: z.enum(["grounded", "limited"]),
  generatedAt: z.string().datetime(),
  citations: z.array(orbCitationSchema).min(1).max(4),
  suggestedAction: z
    .object({
      kind: z.literal("reply"),
      sourceRecordId: z.string(),
      label: z.string(),
      destination: z.string(),
    })
    .optional(),
  completenessWarning: z.string().optional(),
});

export type OrbAnswer = z.infer<typeof orbAnswerSchema>;

const stopWords = new Set([
  "a",
  "about",
  "all",
  "an",
  "and",
  "are",
  "do",
  "for",
  "from",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "the",
  "this",
  "to",
  "today",
  "what",
  "where",
  "who",
  "with",
]);

const synonymGroups = [
  ["reply", "respond", "response", "answer", "email", "message", "unread", "waiting"],
  ["meeting", "calendar", "event", "schedule", "appointment", "call"],
  ["block", "blocked", "blocker", "blocking", "decision", "owner", "unresolved"],
  ["focus", "availability", "free", "protect", "time"],
  ["opportunity", "lead", "partnership", "proposal", "invite"],
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9@]+/g, " ")
    .trim();
}

function queryTerms(query: string): Set<string> {
  const direct = normalize(query)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopWords.has(term));
  const terms = new Set(direct);

  for (const group of synonymGroups) {
    if (group.some((term) => terms.has(term))) {
      group.forEach((term) => terms.add(term));
    }
  }

  return terms;
}

function metadataText(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) return "";
  return Object.values(metadata)
    .filter((value): value is string | number | boolean =>
      ["string", "number", "boolean"].includes(typeof value),
    )
    .join(" ");
}

function excerpt(value: string, maximum = 220): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maximum) return compact;
  return `${compact.slice(0, maximum - 1).trimEnd()}…`;
}

function relevanceScore(
  record: OrbEvidenceRecord,
  terms: Set<string>,
  now: Date,
): number {
  const title = normalize(record.title);
  const body = normalize(record.body);
  const metadata = normalize(metadataText(record.metadata));
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) score += 5;
    if (body.includes(term)) score += 2;
    if (metadata.includes(term)) score += 1;
  }

  const ageDays = Math.abs(now.getTime() - record.occurredAt.getTime()) / 86_400_000;
  score += Math.max(0, 3 - ageDays / 10);

  if (terms.has("reply") && record.sourceType === "gmail-message") score += 4;
  if (terms.has("meeting") && record.sourceType === "calendar-event") score += 5;
  if (terms.has("focus") && record.sourceType === "calendar-event") score += 3;

  const unresolvedTerms = ["block", "decision", "owner", "unresolved"];
  if (
    terms.has("block") &&
    unresolvedTerms.some((term) => title.includes(term) || body.includes(term))
  ) {
    score += 4;
  }

  return score;
}

export function rankOrbEvidence(
  query: string,
  records: OrbEvidenceRecord[],
  now = new Date(),
): Array<{ record: OrbEvidenceRecord; score: number }> {
  const terms = queryTerms(query);
  return records
    .map((record) => ({ record, score: relevanceScore(record, terms, now) }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.record.occurredAt.getTime() - left.record.occurredAt.getTime(),
    )
    .slice(0, 4);
}

export function buildGroundedOrbAnswer(
  query: string,
  records: OrbEvidenceRecord[],
  mode: "live" | "fixture",
  now = new Date(),
): OrbAnswer {
  if (records.length === 0) {
    throw new Error("At least one evidence record is required.");
  }

  const ranked = rankOrbEvidence(query, records, now);
  const strongMatches = ranked.filter(({ score }) => score >= 4);
  const selected = (strongMatches.length > 0 ? strongMatches : ranked.slice(0, 2)).slice(
    0,
    4,
  );
  const confidence = strongMatches.length > 0 ? "grounded" : "limited";
  const lead = selected[0].record;
  const leadExcerpt = excerpt(lead.body || lead.title);
  const supporting = selected.slice(1, 3).map(({ record }) => {
    const detail = excerpt(record.body || record.title, 140);
    return `“${record.title}” says ${detail}`;
  });

  const answer =
    confidence === "grounded"
      ? [
          `The strongest match in your approved sources is “${lead.title}” from ${lead.integration}: ${leadExcerpt}`,
          supporting.length > 0 ? `Supporting context: ${supporting.join("; ")}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : `I could not find a strong direct match. The closest recent approved record is “${lead.title}” from ${lead.integration}: ${leadExcerpt}`;

  return orbAnswerSchema.parse({
    mode,
    query,
    answer,
    confidence,
    generatedAt: now.toISOString(),
    citations: selected.map(({ record }) => ({
      id: `orb-${record.id}`,
      sourceRecordId: record.id,
      integration: record.integration,
      sourceType: record.sourceType,
      sourceLabel: record.title,
      excerpt: excerpt(record.body || record.title),
      sourceUrl: record.sourceUrl,
      observedAt: record.occurredAt.toISOString(),
    })),
    suggestedAction:
      mode === "live" && lead.sourceType === "gmail-message"
        ? {
            kind: "reply",
            sourceRecordId: lead.id,
            label: "Prepare grounded reply",
            destination: "Gmail thread",
          }
        : undefined,
    completenessWarning:
      mode === "fixture"
        ? "Demonstration answer using fixture evidence. Connect and sync Google for answers about your real work."
        : confidence === "limited"
          ? "No strong keyword match was found; Vexa showed the closest recent approved records."
          : undefined,
  });
}
