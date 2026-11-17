CREATE TABLE "weekly_goals" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"total_seconds" integer,
	"swim_meters" integer,
	"swim_seconds" integer,
	"bike_meters" integer,
	"bike_seconds" integer,
	"run_meters" integer,
	"run_seconds" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_goals_swim_one" CHECK ("weekly_goals"."swim_meters" is null or "weekly_goals"."swim_seconds" is null),
	CONSTRAINT "weekly_goals_bike_one" CHECK ("weekly_goals"."bike_meters" is null or "weekly_goals"."bike_seconds" is null),
	CONSTRAINT "weekly_goals_run_one" CHECK ("weekly_goals"."run_meters" is null or "weekly_goals"."run_seconds" is null)
);
--> statement-breakpoint
ALTER TABLE "weekly_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "weekly_goals_select_own" ON "weekly_goals" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("weekly_goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "weekly_goals_insert_own" ON "weekly_goals" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("weekly_goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "weekly_goals_update_own" ON "weekly_goals" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("weekly_goals"."user_id" = (select auth.uid())) WITH CHECK ("weekly_goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "weekly_goals_delete_own" ON "weekly_goals" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("weekly_goals"."user_id" = (select auth.uid()));