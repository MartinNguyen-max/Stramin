CREATE TABLE "favorite_workouts" (
	"user_id" uuid NOT NULL,
	"workout_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_workouts_user_id_workout_id_pk" PRIMARY KEY("user_id","workout_id")
);
--> statement-breakpoint
ALTER TABLE "favorite_workouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "favorite_workouts" ADD CONSTRAINT "favorite_workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorite_workouts_user_created_idx" ON "favorite_workouts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE POLICY "favorite_workouts_select_own" ON "favorite_workouts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("favorite_workouts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "favorite_workouts_insert_own" ON "favorite_workouts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("favorite_workouts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "favorite_workouts_delete_own" ON "favorite_workouts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("favorite_workouts"."user_id" = (select auth.uid()));