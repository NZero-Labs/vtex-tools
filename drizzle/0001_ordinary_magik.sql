CREATE TABLE "active_update_item" (
	"job_id" text NOT NULL,
	"row_number" integer NOT NULL,
	"email" text NOT NULL,
	"cnpj_doc" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"result_code" text,
	"result_message" text,
	"lease_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "active_update_item_job_id_row_number_pk" PRIMARY KEY("job_id","row_number")
);
--> statement-breakpoint
CREATE TABLE "active_update_job" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"unchanged_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "active_update_item" ADD CONSTRAINT "active_update_item_job_id_active_update_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."active_update_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_update_job" ADD CONSTRAINT "active_update_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "active_update_item_job_status_row_idx" ON "active_update_item" USING btree ("job_id","status","row_number");--> statement-breakpoint
CREATE INDEX "active_update_job_user_created_idx" ON "active_update_job" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "active_update_job_expires_idx" ON "active_update_job" USING btree ("expires_at");