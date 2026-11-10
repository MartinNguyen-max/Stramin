ALTER TABLE "activities" ADD COLUMN "avg_watts" real;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "weighted_avg_watts" real;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "device_watts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "best_efforts" jsonb;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "power_bests" jsonb;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "details_fetched_at" timestamp with time zone;