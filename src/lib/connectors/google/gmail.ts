import { z } from "zod";

import type {
  ConnectorAdapter,
  ConnectorContext,
  ConnectorHealth,
  SourceRecord,
} from "@/lib/connectors/contract";

const messageListSchema = z.object({
  messages: z.array(z.object({ id: z.string(), threadId: z.string() })).default([]),
  nextPageToken: z.string().optional(),
});

const messageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  labelIds: z.array(z.string()).default([]),
  snippet: z.string().default(""),
  internalDate: z.string(),
  payload: z.object({
    headers: z
      .array(z.object({ name: z.string(), value: z.string() }))
      .default([]),
  }),
});

type GmailMessage = z.infer<typeof messageSchema>;

function header(message: GmailMessage, name: string): string | undefined {
  return message.payload.headers.find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
  )?.value;
}

export function normalizeGmailMessage(
  message: GmailMessage,
  ingestedAt = new Date().toISOString(),
): SourceRecord {
  const subject = header(message, "Subject")?.trim() || "Untitled email";
  const from = header(message, "From")?.trim() ?? "Unknown sender";
  const occurredAt = new Date(Number(message.internalDate));

  return {
    id: `gmail-${message.id}`,
    externalId: message.id,
    integration: "Google Workspace",
    category: "work",
    sourceType: "gmail-message",
    title: subject,
    body: message.snippet || `Message from ${from}`,
    sourceUrl: `https://mail.google.com/mail/u/0/#inbox/${message.threadId}`,
    occurredAt: Number.isNaN(occurredAt.getTime())
      ? ingestedAt
      : occurredAt.toISOString(),
    ingestedAt,
    metadata: {
      threadId: message.threadId,
      from,
      to: header(message, "To") ?? null,
      labels: message.labelIds.join(","),
      unread: message.labelIds.includes("UNREAD"),
    },
  };
}

async function googleGet<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Gmail API request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export class GoogleGmailConnector implements ConnectorAdapter {
  readonly id = "google-gmail";
  readonly displayName = "Gmail";
  readonly capabilities = new Set(["read", "search"] as const);

  constructor(private readonly accessToken: string) {}

  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async health(): Promise<ConnectorHealth> {
    return { status: "connected" };
  }

  async synchronize(
    _context: ConnectorContext,
    cursor?: string,
  ): Promise<{ records: SourceRecord[]; nextCursor?: string }> {
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("maxResults", "40");
    listUrl.searchParams.set(
      "q",
      "newer_than:14d -category:promotions -category:social -in:spam -in:trash",
    );
    if (cursor) listUrl.searchParams.set("pageToken", cursor);

    const list = messageListSchema.parse(
      await googleGet<unknown>(listUrl, this.accessToken),
    );
    const records: SourceRecord[] = [];

    for (let index = 0; index < list.messages.length; index += 8) {
      const batch = list.messages.slice(index, index + 8);
      const messages = await Promise.all(
        batch.map(async ({ id }) => {
          const messageUrl = new URL(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`,
          );
          messageUrl.searchParams.set("format", "metadata");
          for (const name of ["Subject", "From", "To", "Date"]) {
            messageUrl.searchParams.append("metadataHeaders", name);
          }
          return messageSchema.parse(
            await googleGet<unknown>(messageUrl, this.accessToken),
          );
        }),
      );

      records.push(...messages.map((message) => normalizeGmailMessage(message)));
    }

    return { records, nextCursor: list.nextPageToken };
  }
}
