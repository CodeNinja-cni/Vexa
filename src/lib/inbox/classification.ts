import type { InboxCategory, InboxItem } from "@/lib/inbox/contracts";

export interface InboxSourceRecord {
  id: string;
  title: string;
  body: string;
  sourceUrl?: string;
  occurredAt: Date;
  metadata?: Record<string, unknown> | null;
}

function metadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function parseSender(value: string): { name: string; email: string } {
  const match = value.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  if (value.includes("@")) return { name: value.split("@")[0], email: value };
  return { name: value || "Unknown sender", email: "Unknown email" };
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

export function classifyInboxRecord(
  record: InboxSourceRecord,
  currentUserEmail: string,
  now = new Date(),
): InboxItem {
  const from = parseSender(metadataString(record.metadata, "from"));
  const labels = metadataString(record.metadata, "labels");
  const unread = record.metadata?.unread === true || labels.includes("UNREAD");
  const normalized = `${record.title} ${record.body}`.toLowerCase();
  const outbound = from.email.toLowerCase() === currentUserEmail.toLowerCase();
  const opportunity = includesAny(normalized, [
    "opportunity",
    "partnership",
    "proposal",
    "invite",
    "invitation",
    "pilot",
    "speaker",
  ]);
  const decision = includesAny(normalized, [
    "urgent",
    "decision",
    "approve",
    "confirm",
    "blocking",
    "review",
    "before",
    "deadline",
    "?",
  ]);

  let category: InboxCategory = "fyi";
  let reason = "Recent message retained for context.";
  let priorityScore = 20;
  if (outbound) {
    category = "waiting";
    reason = "This message was sent from your account and may be waiting on a response.";
    priorityScore = 58;
  } else if (opportunity) {
    category = "opportunity";
    reason = "The conversation contains a partnership, proposal, pilot, or invitation signal.";
    priorityScore = 72;
  } else if (unread || decision) {
    category = "priority";
    reason = unread && decision
      ? "Unread and contains a decision, question, review, or deadline signal."
      : unread
        ? "Unread message from an approved Gmail source."
        : "Contains a decision, question, review, or deadline signal.";
    priorityScore = unread && decision ? 92 : unread ? 76 : 68;
  }

  const ageHours = Math.max(0, (now.getTime() - record.occurredAt.getTime()) / 3_600_000);
  priorityScore = Math.max(0, Math.min(100, Math.round(priorityScore - ageHours / 12)));

  return {
    id: record.id,
    channel: "Gmail",
    senderName: from.name,
    senderEmail: from.email,
    initials: initials(from.name),
    subject: record.title,
    preview: record.body,
    occurredAt: record.occurredAt.toISOString(),
    unread,
    category,
    priorityScore,
    reason,
    sourceUrl: record.sourceUrl,
  };
}

export function rankInbox(items: InboxItem[]): InboxItem[] {
  return [...items].sort(
    (left, right) =>
      right.priorityScore - left.priorityScore ||
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}
