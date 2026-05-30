import {
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

export const matchStageEnum = pgEnum("match_stage", [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
  "unknown",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "in_progress",
  "finished",
  "postponed",
  "cancelled",
  "unknown",
]);

export const specialPredictionTypeEnum = pgEnum("special_prediction_type", [
  "group_winner",
  "negative_surprise",
  "champion",
  "runner_up",
  "third_place",
]);

export const syncRunTypeEnum = pgEnum("sync_run_type", [
  "full",
  "fixtures",
  "teams",
  "standings",
  "results",
]);

export const syncRunStatusEnum = pgEnum("sync_run_status", ["running", "success", "failed"]);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    apiFootballTeamId: integer("api_football_team_id"),
    name: text("name").notNull(),
    countryCode: text("country_code"),
    flagUrl: text("flag_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("teams_api_football_team_id_idx").on(table.apiFootballTeamId)],
);

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const groupTeams = pgTable(
  "group_teams",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    positionSeed: integer("position_seed"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.teamId] })],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    apiFootballFixtureId: integer("api_football_fixture_id").notNull(),
    stage: matchStageEnum("stage").notNull().default("unknown"),
    roundName: text("round_name"),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
    homeTeamId: uuid("home_team_id").references(() => teams.id, { onDelete: "set null" }),
    awayTeamId: uuid("away_team_id").references(() => teams.id, { onDelete: "set null" }),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    venueName: text("venue_name"),
    venueCity: text("venue_city"),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    homeGoals: integer("home_goals"),
    awayGoals: integer("away_goals"),
    winnerTeamId: uuid("winner_team_id").references(() => teams.id, { onDelete: "set null" }),
    rawStatus: text("raw_status"),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("matches_api_football_fixture_id_idx").on(table.apiFootballFixtureId)],
);

export const standings = pgTable(
  "standings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    points: integer("points"),
    played: integer("played"),
    won: integer("won"),
    drawn: integer("drawn"),
    lost: integer("lost"),
    goalsFor: integer("goals_for"),
    goalsAgainst: integer("goals_against"),
    goalDifference: integer("goal_difference"),
    rawData: jsonb("raw_data"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("standings_group_team_idx").on(table.groupId, table.teamId)],
);

export const matchPredictions = pgTable(
  "match_predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    homeGoals: integer("home_goals").notNull(),
    awayGoals: integer("away_goals").notNull(),
    predictedWinnerTeamId: uuid("predicted_winner_team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("match_predictions_username_match_idx").on(table.username, table.matchId)],
);

export const userAllIns = pgTable("user_all_ins", {
  username: text("username").primaryKey(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const specialPredictions = pgTable(
  "special_predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    type: specialPredictionTypeEnum("type").notNull(),
    scopeKey: text("scope_key").notNull(),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("special_predictions_username_type_scope_idx").on(
      table.username,
      table.type,
      table.scopeKey,
    ),
  ],
);

export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: syncRunTypeEnum("type").notNull(),
  status: syncRunStatusEnum("status").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
});

export type Team = typeof teams.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchPredictionRecord = typeof matchPredictions.$inferSelect;
export type MatchStage = (typeof matchStageEnum.enumValues)[number];
export type MatchStatus = (typeof matchStatusEnum.enumValues)[number];
export type SyncRunType = (typeof syncRunTypeEnum.enumValues)[number];
