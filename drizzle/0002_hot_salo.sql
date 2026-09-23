CREATE TABLE "action_evidence" (
	"organization_id" uuid NOT NULL,
	"action_id" uuid NOT NULL,
	"source_record_id" uuid NOT NULL,
	"excerpt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "action_evidence_action_id_source_record_id_pk" PRIMARY KEY("action_id","source_record_id")
);
--> statement-breakpoint
ALTER TABLE "action_evidence" ADD CONSTRAINT "action_evidence_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_evidence" ADD CONSTRAINT "action_evidence_action_id_suggested_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."suggested_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_evidence" ADD CONSTRAINT "action_evidence_source_record_id_source_records_id_fk" FOREIGN KEY ("source_record_id") REFERENCES "public"."source_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_evidence_org_action_idx" ON "action_evidence" USING btree ("organization_id","action_id");