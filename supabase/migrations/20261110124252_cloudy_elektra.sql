CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"event_date" date NOT NULL,
	"type" text DEFAULT 'triathlon' NOT NULL,
	"image_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sport" text NOT NULL,
	"distance_m" integer NOT NULL,
	"target_seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "personal_bests" (
	"user_id" uuid NOT NULL,
	"sport" text NOT NULL,
	"distance_m" integer NOT NULL,
	"seconds" integer NOT NULL,
	"achieved_on" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_bests_user_id_sport_distance_m_pk" PRIMARY KEY("user_id","sport","distance_m")
);
--> statement-breakpoint
ALTER TABLE "personal_bests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_bests" ADD CONSTRAINT "personal_bests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_user_date_idx" ON "events" USING btree ("user_id","event_date");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "events_select_own" ON "events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("events"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "events_insert_own" ON "events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("events"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "events_update_own" ON "events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("events"."user_id" = (select auth.uid())) WITH CHECK ("events"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "events_delete_own" ON "events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("events"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "goals_select_own" ON "goals" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "goals_insert_own" ON "goals" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "goals_update_own" ON "goals" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("goals"."user_id" = (select auth.uid())) WITH CHECK ("goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "goals_delete_own" ON "goals" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "personal_bests_select_own" ON "personal_bests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("personal_bests"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "personal_bests_insert_own" ON "personal_bests" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("personal_bests"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "personal_bests_update_own" ON "personal_bests" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("personal_bests"."user_id" = (select auth.uid())) WITH CHECK ("personal_bests"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "personal_bests_delete_own" ON "personal_bests" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("personal_bests"."user_id" = (select auth.uid()));