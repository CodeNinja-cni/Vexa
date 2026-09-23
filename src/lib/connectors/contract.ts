import type { SourceCategory } from "@/lib/domain/models";

export type ConnectorCapability =
  | "read"
  | "search"
  | "webhook"
  | "draft"
  | "execute";

export interface ConnectorContext {
  organizationId: string;
  userId: string;
  correlationId: string;
}

export interface SourceRecord {
  id: string;
  externalId: string;
  integration: string;
  category: SourceCategory;
  sourceType: string;
  title: string;
  body: string;
  sourceUrl?: string;
  occurredAt: string;
  ingestedAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ConnectorHealth {
  status: "connected" | "degraded" | "disconnected";
  lastSynchronizedAt?: string;
  message?: string;
}

export interface ConnectorAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly capabilities: ReadonlySet<ConnectorCapability>;
  connect(context: ConnectorContext): Promise<void>;
  disconnect(context: ConnectorContext): Promise<void>;
  health(context: ConnectorContext): Promise<ConnectorHealth>;
  synchronize(context: ConnectorContext, cursor?: string): Promise<{
    records: SourceRecord[];
    nextCursor?: string;
  }>;
}
