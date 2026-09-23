import {
  relationshipPersonSchema,
  type RelationshipCommitment,
  type RelationshipEvidence,
  type RelationshipPerson,
  type RelationshipSignal,
} from "@/lib/relationships/contracts";

export interface RelationshipSourceRecord {
  id: string;
  title: string;
  body: string;
  sourceUrl?: string;
  occurredAt: Date;
  metadata?: Record<string, unknown> | null;
}

interface Address {
  name: string;
  email: string;
}

interface PersonAccumulator {
  contact: Address;
  records: Array<{
    source: RelationshipSourceRecord;
    direction: "inbound" | "outbound";
    unread: boolean;
    opportunity: boolean;
    actionSignal: boolean;
  }>;
}

const opportunityTerms = [
  "opportunity",
  "partnership",
  "proposal",
  "pilot",
  "invite",
  "invitation",
  "speaker",
  "investment",
];

const actionTerms = [
  "?",
  "need",
  "please",
  "confirm",
  "approve",
  "review",
  "send",
  "share",
  "sharing",
  "promised",
  "follow up",
  "before",
  "deadline",
];

function metadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

export function parseRelationshipAddress(value: string): Address {
  const match = value.match(/(?:^|,)\s*"?([^"<,]+?)"?\s*<([^>]+)>/);
  if (match) return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
  const emailMatch = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) {
    const email = emailMatch[0].toLowerCase();
    return { name: email.split("@")[0].replace(/[._-]+/g, " "), email };
  }
  return { name: value.trim() || "Unknown contact", email: "" };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function relationshipId(email: string): string {
  return `gmail-${email.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function buildDetail(
  name: string,
  inboundCount: number,
  outboundCount: number,
  signal: RelationshipSignal,
): string {
  const firstName = name.split(" ")[0] || name;
  if (signal === "opportunity") {
    return `${firstName}'s recent messages contain a partnership, pilot, invitation, or investment signal.`;
  }
  if (signal === "needs_reply") {
    return `${firstName}'s latest message contains a question or action signal that may need your response.`;
  }
  if (signal === "waiting") {
    return `Your latest exchange with ${firstName} was outbound, so this relationship may be waiting on them.`;
  }
  return `${inboundCount} inbound and ${outboundCount} outbound recent Gmail messages provide the current context.`;
}

function commitmentFor(
  record: PersonAccumulator["records"][number],
  now: Date,
): RelationshipCommitment | null {
  if (!record.actionSignal) return null;
  const ageHours = Math.max(
    0,
    (now.getTime() - record.source.occurredAt.getTime()) / 3_600_000,
  );
  const status = record.direction === "outbound"
    ? "waiting" as const
    : ageHours > 48
      ? "due" as const
      : "open" as const;
  return {
    id: `commitment-${record.source.id}`,
    title: record.direction === "outbound"
      ? `Follow up on ${record.source.title}`
      : `Respond to ${record.source.title}`,
    summary: record.source.body,
    status,
    sourceRecordId: record.source.id,
    sourceLabel: record.source.title,
    occurredAt: record.source.occurredAt.toISOString(),
  };
}

export function aggregateRelationships(
  records: RelationshipSourceRecord[],
  currentUserEmail: string,
  now = new Date(),
): RelationshipPerson[] {
  const currentEmail = currentUserEmail.trim().toLowerCase();
  const byEmail = new Map<string, PersonAccumulator>();

  for (const source of records) {
    const from = parseRelationshipAddress(metadataString(source.metadata, "from"));
    const outbound = from.email === currentEmail;
    const contact = outbound
      ? parseRelationshipAddress(metadataString(source.metadata, "to"))
      : from;
    if (!contact.email || contact.email === currentEmail) continue;

    const normalized = `${source.title} ${source.body}`.toLowerCase();
    const record = {
      source,
      direction: outbound ? "outbound" as const : "inbound" as const,
      unread:
        source.metadata?.unread === true ||
        metadataString(source.metadata, "labels").includes("UNREAD"),
      opportunity: includesAny(normalized, opportunityTerms),
      actionSignal: includesAny(normalized, actionTerms),
    };
    const existing = byEmail.get(contact.email);
    if (existing) {
      existing.records.push(record);
      if (existing.contact.name.includes("@") && !contact.name.includes("@")) {
        existing.contact = contact;
      }
    } else {
      byEmail.set(contact.email, { contact, records: [record] });
    }
  }

  return [...byEmail.values()]
    .map(({ contact, records: personRecords }) => {
      const ordered = [...personRecords].sort(
        (left, right) => right.source.occurredAt.getTime() - left.source.occurredAt.getTime(),
      );
      const latest = ordered[0];
      const inboundCount = ordered.filter((record) => record.direction === "inbound").length;
      const outboundCount = ordered.length - inboundCount;
      const hasOpportunity = ordered.some((record) => record.opportunity);
      const latestNeedsReply = latest.direction === "inbound" &&
        (latest.unread || latest.actionSignal);
      const signal: RelationshipSignal = hasOpportunity
        ? "opportunity"
        : latestNeedsReply
          ? "needs_reply"
          : latest.direction === "outbound"
            ? "waiting"
            : "active";
      const ageHours = Math.max(
        0,
        (now.getTime() - latest.source.occurredAt.getTime()) / 3_600_000,
      );
      const signalBase = {
        opportunity: 88,
        needs_reply: 82,
        waiting: 64,
        active: 45,
      }[signal];
      const score = Math.max(
        0,
        Math.min(100, Math.round(signalBase + Math.min(8, ordered.length * 2) - ageHours / 24)),
      );
      const evidence: RelationshipEvidence[] = ordered.slice(0, 5).map((record) => ({
        sourceRecordId: record.source.id,
        sourceLabel: record.source.title,
        excerpt: record.source.body,
        sourceUrl: record.source.sourceUrl,
        occurredAt: record.source.occurredAt.toISOString(),
        direction: record.direction,
      }));
      const commitments = ordered
        .map((record) => commitmentFor(record, now))
        .filter((commitment): commitment is RelationshipCommitment => commitment !== null)
        .slice(0, 4);

      return relationshipPersonSchema.parse({
        id: relationshipId(contact.email),
        name: contact.name,
        email: contact.email,
        initials: initials(contact.name),
        channel: "Gmail",
        signal,
        score,
        detail: buildDetail(contact.name, inboundCount, outboundCount, signal),
        lastContactAt: latest.source.occurredAt.toISOString(),
        messageCount: ordered.length,
        inboundCount,
        outboundCount,
        evidence,
        commitments,
      });
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        new Date(right.lastContactAt).getTime() - new Date(left.lastContactAt).getTime(),
    );
}
