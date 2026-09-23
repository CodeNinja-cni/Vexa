CREATE TABLE "action_payload_versions" (
	"organization_id" uuid NOT NULL,
	"action_id" uuid NOT NULL,
	"payload_version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"change_summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "action_payload_versions_action_id_payload_version_pk" PRIMARY KEY("action_id","payload_version")
);
--> statement-breakpoint
ALTER TABLE "action_payload_versions" ADD CONSTRAINT "action_payload_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_payload_versions" ADD CONSTRAINT "action_payload_versions_action_id_suggested_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."suggested_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_payload_versions" ADD CONSTRAINT "action_payload_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_payload_versions_org_action_idx" ON "action_payload_versions" USING btree ("organization_id","action_id");--> statement-breakpoint
INSERT INTO "action_payload_versions" (
	"organization_id",
	"action_id",
	"payload_version",
	"payload",
	"created_by_user_id",
	"change_summary",
	"created_at"
)
SELECT
	"organization_id",
	"id",
	"payload_version",
	"payload",
	"user_id",
	'Imported current payload during version-history migration',
	"created_at"
FROM "suggested_actions"
ON CONFLICT ("action_id", "payload_version") DO NOTHING;
