import { z } from "zod";

export const evidenceRecordSchema = z.object({
  id: z.string().uuid(),
  sourceType: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  sourceUrl: z.string().url().nullable(),
  occurredAt: z.date(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

export const groundedDraftSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  destination: z.string().min(1),
  groundingMode: z.enum(["deterministic", "model"]),
  evidence: z.array(
    z.object({
      sourceRecordId: z.string().uuid(),
      label: z.string().min(1),
      excerpt: z.string().min(1),
      sourceUrl: z.string().url().nullable(),
    }),
  ).min(1),
});

export type GroundedDraft = z.infer<typeof groundedDraftSchema>;

function metadataString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function senderName(from: string | undefined): string | undefined {
  if (!from) return undefined;
  const beforeAddress = from.split("<")[0]?.trim();
  const candidate = beforeAddress || from.split("@")[0]?.trim();
  return candidate?.split(/\s+/)[0]?.replace(/[^\p{L}\p{N}'-]/gu, "") || undefined;
}

function excerpt(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact;
}

export function prepareDeterministicReply(
  records: EvidenceRecord[],
  instruction?: string,
): GroundedDraft {
  const evidence = z.array(evidenceRecordSchema).min(1).max(10).parse(records);
  const email = evidence.find((record) => record.sourceType === "gmail-message");

  if (!email) {
    throw new Error("A Gmail message is required to prepare a reply.");
  }

  const from = metadataString(email.metadata, "from");
  const firstName = senderName(from);
  const threadId = metadataString(email.metadata, "threadId");
  const requestedTone = instruction?.toLowerCase().includes("formal")
    ? "formal"
    : "natural";
  const greeting = firstName ? `Hi ${firstName},` : "Hello,";
  const acknowledgment = email.body.trim()
    ? `Thanks for your message about “${email.title}”. I’ve reviewed the details you shared.`
    : `Thanks for your message about “${email.title}”.`;
  const close =
    requestedTone === "formal"
      ? "I’ll confirm the next step shortly.\n\nBest regards,"
      : "I’ll confirm the next step shortly.\n\nBest,";

  return groundedDraftSchema.parse({
    subject: email.title.toLowerCase().startsWith("re:")
      ? email.title
      : `Re: ${email.title}`,
    body: `${greeting}\n\n${acknowledgment}\n\n${close}`,
    destination: threadId ? `Gmail thread ${threadId}` : "Gmail thread",
    groundingMode: "deterministic",
    evidence: evidence.map((record) => ({
      sourceRecordId: record.id,
      label: record.title,
      excerpt: excerpt(record.body || record.title),
      sourceUrl: record.sourceUrl,
    })),
  });
}
