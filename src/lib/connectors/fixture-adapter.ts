import type {
  ConnectorAdapter,
  ConnectorHealth,
  SourceRecord,
} from "@/lib/connectors/contract";

export class FixtureConnectorAdapter implements ConnectorAdapter {
  readonly capabilities = new Set(["read", "search"] as const);

  constructor(
    readonly id: string,
    readonly displayName: string,
    private readonly records: SourceRecord[],
  ) {}

  async connect(): Promise<void> {
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async health(): Promise<ConnectorHealth> {
    return Promise.resolve({
      status: "connected",
      lastSynchronizedAt: new Date().toISOString(),
      message: "Fixture-backed demo connector",
    });
  }

  async synchronize(): Promise<{ records: SourceRecord[]; nextCursor?: string }> {
    return Promise.resolve({ records: structuredClone(this.records) });
  }
}
