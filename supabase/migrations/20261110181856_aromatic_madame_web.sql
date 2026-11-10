CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_activity_id" text NOT NULL,
	"name" text NOT NULL,
	"sport" text NOT NULL,
	"sport_type" text NOT NULL,
	"is_indoor" boolean DEFAULT false NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"start_local" text NOT NULL,
	"moving_seconds" integer NOT NULL,
	"elapsed_seconds" integer NOT NULL,
	"distance_m" real DEFAULT 0 NOT NULL,
	"elevation_m" real,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_athlete_id" text NOT NULL,
	"athlete_name" text,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" text NOT NULL,
	"import_state" text DEFAULT 'pending' NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"last_full_sync_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_provider_activity_idx" ON "activities" USING btree ("provider","provider_activity_id");--> statement-breakpoint
CREATE INDEX "activities_user_start_idx" ON "activities" USING btree ("user_id","start_local");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_user_provider_idx" ON "connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_provider_athlete_idx" ON "connections" USING btree ("provider","provider_athlete_id");--> statement-breakpoint
CREATE POLICY "activities_select_own" ON "activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("activities"."user_id" = (select auth.uid()));