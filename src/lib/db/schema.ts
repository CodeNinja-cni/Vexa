import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", ["member", "admin"]);
export const integrationStatus = pgEnum("integration_status", [
  "connected",
  "degraded",
  "disconnected",
]);
export const sourceCategory = pgEnum("source_category", [
  "work",
  "social",
  "news",
  "protect",
]);
export const urgency = pgEnum("urgency", ["critical", "high", "normal", "low"]);
export const actionStatus = pgEnum("action_status", [
  "recommended",
  "prepared",
  "awaiting_approval",
  "approved",
  "rejected",
  "expired",
  "executing",
  "succeeded",
  "failed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...timestamps,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  jobTitle: text("job_title"),
  passwordHash: text("password_hash"),
  ...timestamps,
});

export const memberships = pgTable(
  "memberships",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRole("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    index("memberships_user_idx").on(table.userId),
  ],
);

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    provider: text("provider").notNull(),
    externalAccountId: text("external_account_id"),
    status: integrationStatus("status").default("disconnected").notNull(),
    capabilities: jsonb("capabilities").$type<string[]>().default([]).notNull(),
    encryptedCredentialReference: text("encrypted_credential_reference"),
    isFixture: boolean("is_fixture").default(false).notNull(),
    lastSynchronizedAt: timestamp("last_synchronized_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("integrations_organization_idx").on(table.organizationId),
    uniqueIndex("integrations_org_provider_account_uidx").on(
      table.organizationId,
      table.provider,
      table.externalAccountId,
    ),
  ],
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index("user_sessions_user_idx").on(table.userId),
    index("user_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const sourceRecords = pgTable(
  "source_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    category: sourceCategory("category").notNull(),
    sourceType: text("source_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sourceUrl: text("source_url"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => [
    index("source_records_org_occurred_idx").on(table.organizationId, table.occurredAt),
    uniqueIndex("source_records_integration_external_uidx").on(
      table.organizationId,
      table.integrationId,
      table.externalId,
    ),
  ],
);

export const briefings = pgTable(
  "briefings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
    completenessWarning: text("completeness_warning"),
    ...timestamps,
  },
  (table) => [index("briefings_org_user_generated_idx").on(table.organizationId, table.userId, table.generatedAt)],
);

export const briefingItems = pgTable(
  "briefing_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    briefingId: uuid("briefing_id")
      .notNull()
      .references(() => briefings.id, { onDelete: "cascade" }),
    category: sourceCategory("category").notNull(),
    urgency: urgency("urgency").notNull(),
    rank: integer("rank").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    rationale: text("rationale").notNull(),
    dueLabel: text("due_label"),
    ...timestamps,
  },
  (table) => [
    index("briefing_items_org_briefing_rank_idx").on(
      table.organizationId,
      table.briefingId,
      table.rank,
    ),
  ],
);

export const citations = pgTable(
  "citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    briefingItemId: uuid("briefing_item_id").references(() => briefingItems.id, {
      onDelete: "cascade",
    }),
    sourceRecordId: uuid("source_record_id")
      .notNull()
      .references(() => sourceRecords.id, { onDelete: "cascade" }),
    excerpt: text("excerpt"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("citations_org_briefing_item_idx").on(table.organizationId, table.briefingItemId),
  ],
);

export const suggestedActions = pgTable(
  "suggested_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    briefingItemId: uuid("briefing_item_id").references(() => briefingItems.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    destination: text("destination").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    payloadVersion: integer("payload_version").default(1).notNull(),
    approvedPayloadVersion: integer("approved_payload_version"),
    status: actionStatus("status").default("recommended").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("suggested_actions_org_status_idx").on(table.organizationId, table.status)],
);

export const actionEvidence = pgTable(
  "action_evidence",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actionId: uuid("action_id")
      .notNull()
      .references(() => suggestedActions.id, { onDelete: "cascade" }),
    sourceRecordId: uuid("source_record_id")
      .notNull()
      .references(() => sourceRecords.id, { onDelete: "cascade" }),
    excerpt: text("excerpt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.actionId, table.sourceRecordId] }),
    index("action_evidence_org_action_idx").on(
      table.organizationId,
      table.actionId,
    ),
  ],
);

export const actionPayloadVersions = pgTable(
  "action_payload_versions",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actionId: uuid("action_id")
      .notNull()
      .references(() => suggestedActions.id, { onDelete: "cascade" }),
    payloadVersion: integer("payload_version").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    changeSummary: text("change_summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.actionId, table.payloadVersion] }),
    index("action_payload_versions_org_action_idx").on(
      table.organizationId,
      table.actionId,
    ),
  ],
);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actionId: uuid("action_id")
      .notNull()
      .references(() => suggestedActions.id, { onDelete: "cascade" }),
    payloadVersion: integer("payload_version").notNull(),
    decision: text("decision"),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("approval_requests_org_action_idx").on(table.organizationId, table.actionId)],
);

export const executionRecords = pgTable(
  "execution_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actionId: uuid("action_id")
      .notNull()
      .references(() => suggestedActions.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull(),
    providerReference: text("provider_reference"),
    result: jsonb("result").$type<Record<string, unknown>>(),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("execution_records_org_idempotency_uidx").on(
      table.organizationId,
      table.idempotencyKey,
    ),
    index("execution_records_org_action_idx").on(table.organizationId, table.actionId),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    correlationId: text("correlation_id").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_events_org_created_idx").on(table.organizationId, table.createdAt),
    index("audit_events_org_subject_idx").on(
      table.organizationId,
      table.subjectType,
      table.subjectId,
    ),
  ],
);
