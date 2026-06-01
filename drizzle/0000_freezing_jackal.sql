CREATE TYPE "public"."match_stage" AS ENUM('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'in_progress', 'finished', 'postponed', 'cancelled', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."special_prediction_type" AS ENUM('group_winner', 'negative_surprise', 'champion', 'runner_up', 'third_place');--> statement-breakpoint
CREATE TYPE "public"."sync_run_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_run_type" AS ENUM('full', 'fixtures', 'teams', 'standings', 'results');--> statement-breakpoint
CREATE TABLE "group_teams" (
	"group_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"position_seed" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_teams_group_id_team_id_pk" PRIMARY KEY("group_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "match_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"match_id" uuid NOT NULL,
	"home_goals" integer NOT NULL,
	"away_goals" integer NOT NULL,
	"predicted_winner_team_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_fixture_id" integer NOT NULL,
	"stage" "match_stage" DEFAULT 'unknown' NOT NULL,
	"round_name" text,
	"group_id" uuid,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"kickoff_at" timestamp with time zone NOT NULL,
	"venue_name" text,
	"venue_city" text,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"home_goals" integer,
	"away_goals" integer,
	"winner_team_id" uuid,
	"raw_status" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "special_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"type" "special_prediction_type" NOT NULL,
	"scope_key" text NOT NULL,
	"group_id" uuid,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"points" integer,
	"played" integer,
	"won" integer,
	"drawn" integer,
	"lost" integer,
	"goals_for" integer,
	"goals_against" integer,
	"goal_difference" integer,
	"raw_data" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "sync_run_type" NOT NULL,
	"status" "sync_run_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"error_message" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_team_id" integer,
	"name" text NOT NULL,
	"country_code" text,
	"flag_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_all_ins" (
	"username" text PRIMARY KEY NOT NULL,
	"match_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_teams" ADD CONSTRAINT "group_teams_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_teams" ADD CONSTRAINT "group_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_predictions" ADD CONSTRAINT "match_predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_predictions" ADD CONSTRAINT "match_predictions_predicted_winner_team_id_teams_id_fk" FOREIGN KEY ("predicted_winner_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_all_ins" ADD CONSTRAINT "user_all_ins_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "match_predictions_username_match_idx" ON "match_predictions" USING btree ("username","match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_external_fixture_id_idx" ON "matches" USING btree ("external_fixture_id");--> statement-breakpoint
CREATE UNIQUE INDEX "special_predictions_username_type_scope_idx" ON "special_predictions" USING btree ("username","type","scope_key");--> statement-breakpoint
CREATE UNIQUE INDEX "standings_group_team_idx" ON "standings" USING btree ("group_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_external_team_id_idx" ON "teams" USING btree ("external_team_id");
