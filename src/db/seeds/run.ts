import { config } from "dotenv";
import { closeDbConnection, db } from "@/db/client";
import {
  groupTeams,
  groups,
  matches,
  matchPredictions,
  specialPredictions,
  standings,
  syncRuns,
  teams,
  userAllIns,
  type Match,
  type Team,
} from "@/db/schema";

config({ path: ".env.local", override: true });

const scenarios = [
  "pre-worldcup",
  "group-stage-day-1",
  "group-stage-mid",
  "group-stage-finished",
  "knockouts-start",
  "knockouts-mid",
  "finished-worldcup",
] as const;

type ScenarioName = (typeof scenarios)[number];

type SeedContext = {
  scenario: ScenarioName;
  teams: Team[];
  groups: { id: string; code: string }[];
  matches: Match[];
};

const teamNames = [
  "Argentina",
  "Brasil",
  "Alemania",
  "Francia",
  "España",
  "Inglaterra",
  "Holanda",
  "Uruguay",
  "Portugal",
  "Italia",
  "Croacia",
  "Belgica",
  "Mexico",
  "Canada",
  "Estados Unidos",
  "Japon",
  "Corea del Sur",
  "Marruecos",
  "Senegal",
  "Nigeria",
  "Ghana",
  "Egipto",
  "Australia",
  "Nueva Zelanda",
  "Chile",
  "Colombia",
  "Peru",
  "Ecuador",
  "Paraguay",
  "Costa Rica",
  "Panama",
  "Jamaica",
  "Arabia Saudita",
  "Iran",
  "Qatar",
  "Camerun",
  "Tunez",
  "Argelia",
  "Dinamarca",
  "Suiza",
  "Suecia",
  "Noruega",
  "Polonia",
  "Serbia",
  "Austria",
  "Turquia",
  "Grecia",
  "Irlanda",
] as const;

function isScenarioName(value: string): value is ScenarioName {
  return scenarios.includes(value as ScenarioName);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seeds in production.");
  }

  const scenario = process.argv[2];

  if (!scenario || !isScenarioName(scenario)) {
    throw new Error(`Usage: npm run db:seed -- <${scenarios.join("|")}>`);
  }

  await clearTournamentData();
  const context = await seedTournamentSkeleton(scenario);
  await seedScenarioState(context);
  await seedDemoPredictions(context);
  await insertSyncRun(scenario);

  console.log(`Seed scenario loaded: ${scenario}`);
  console.log(`Teams: ${context.teams.length}`);
  console.log(`Groups: ${context.groups.length}`);
  console.log(`Matches: ${context.matches.length}`);
}

async function clearTournamentData() {
  await db.delete(syncRuns);
  await db.delete(userAllIns);
  await db.delete(specialPredictions);
  await db.delete(matchPredictions);
  await db.delete(standings);
  await db.delete(matches);
  await db.delete(groupTeams);
  await db.delete(groups);
  await db.delete(teams);
}

async function seedTournamentSkeleton(scenario: ScenarioName): Promise<SeedContext> {
  const insertedTeams = await db
    .insert(teams)
    .values(
      teamNames.map((name, index) => ({
        externalTeamId: 1000 + index,
        name,
        countryCode: name.slice(0, 3).toUpperCase(),
      })),
    )
    .returning();

  const insertedGroups = await db
    .insert(groups)
    .values(
      Array.from({ length: 12 }, (_, index) => {
        const code = String.fromCharCode(65 + index);
        return { code, name: `Group ${code}` };
      }),
    )
    .returning();

  await db.insert(groupTeams).values(
    insertedGroups.flatMap((group, groupIndex) =>
      insertedTeams.slice(groupIndex * 4, groupIndex * 4 + 4).map((team, teamIndex) => ({
        groupId: group.id,
        teamId: team.id,
        positionSeed: teamIndex + 1,
      })),
    ),
  );

  const groupMatchValues = buildGroupMatches(insertedGroups, insertedTeams, scenario);
  const knockoutMatchValues = buildKnockoutMatches(insertedTeams, scenario);

  const insertedMatches = await db
    .insert(matches)
    .values([...groupMatchValues, ...knockoutMatchValues])
    .returning();

  return {
    scenario,
    teams: insertedTeams,
    groups: insertedGroups.map((group) => ({ id: group.id, code: group.code })),
    matches: insertedMatches,
  };
}

function buildGroupMatches(
  insertedGroups: { id: string; code: string }[],
  insertedTeams: Team[],
  scenario: ScenarioName,
) {
  let fixtureId = 2000;
  let matchIndex = 0;
  const pairings = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ] as const;

  return insertedGroups.flatMap((group, groupIndex) => {
    const groupTeams = insertedTeams.slice(groupIndex * 4, groupIndex * 4 + 4);

    return pairings.map(([homeIndex, awayIndex]) => {
      const kickoffAt = buildKickoffDate(matchIndex);
      const result = getGroupResultForIndex(matchIndex, scenario);
      matchIndex += 1;

      return {
        externalFixtureId: fixtureId++,
        stage: "group" as const,
        roundName: `Group ${group.code}`,
        groupId: group.id,
        homeTeamId: groupTeams[homeIndex].id,
        awayTeamId: groupTeams[awayIndex].id,
        kickoffAt,
        venueName: "Seed Stadium",
        venueCity: "Seed City",
        status: result ? ("finished" as const) : ("scheduled" as const),
        homeGoals: result?.homeGoals ?? null,
        awayGoals: result?.awayGoals ?? null,
        winnerTeamId: result
          ? getWinnerTeamId(groupTeams[homeIndex].id, groupTeams[awayIndex].id, result)
          : null,
        rawStatus: result ? "FT" : "NS",
        rawData: { seed: true, scenario },
      };
    });
  });
}

function buildKnockoutMatches(insertedTeams: Team[], scenario: ScenarioName) {
  const definitions = [
    { stage: "round_of_32", count: 16, firstDateOffset: 25 },
    { stage: "round_of_16", count: 8, firstDateOffset: 31 },
    { stage: "quarter_final", count: 4, firstDateOffset: 36 },
    { stage: "semi_final", count: 2, firstDateOffset: 40 },
    { stage: "third_place", count: 1, firstDateOffset: 43 },
    { stage: "final", count: 1, firstDateOffset: 44 },
  ] as const;

  let fixtureId = 3000;
  let teamCursor = 0;
  let knockoutIndex = 0;
  const teamsDefined = isAtLeast(scenario, "knockouts-start");
  const finishedCount =
    scenario === "knockouts-mid" ? 12 : scenario === "finished-worldcup" ? 32 : 0;

  return definitions.flatMap((definition) =>
    Array.from({ length: definition.count }, (_, index) => {
      const homeTeam = teamsDefined ? insertedTeams[teamCursor % insertedTeams.length] : null;
      const awayTeam = teamsDefined ? insertedTeams[(teamCursor + 1) % insertedTeams.length] : null;
      teamCursor += 2;

      const isFinished = knockoutIndex < finishedCount;
      const result = isFinished ? getKnockoutResultForIndex(knockoutIndex) : null;
      const kickoffAt = buildKickoffDate(definition.firstDateOffset * 4 + index);
      knockoutIndex += 1;

      return {
        externalFixtureId: fixtureId++,
        stage: definition.stage,
        roundName: getStageLabel(definition.stage),
        groupId: null,
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        kickoffAt,
        venueName: "Seed Stadium",
        venueCity: "Seed City",
        status: result ? ("finished" as const) : ("scheduled" as const),
        homeGoals: result?.homeGoals ?? null,
        awayGoals: result?.awayGoals ?? null,
        winnerTeamId: result && homeTeam && awayTeam
          ? result.winner === "home"
            ? homeTeam.id
            : awayTeam.id
          : null,
        rawStatus: result ? "FT" : "NS",
        rawData: { seed: true, scenario },
      };
    }),
  );
}

async function seedScenarioState(context: SeedContext) {
  if (!isAtLeast(context.scenario, "group-stage-finished")) {
    return;
  }

  await db.insert(standings).values(
    context.groups.flatMap((group, groupIndex) =>
      context.teams.slice(groupIndex * 4, groupIndex * 4 + 4).map((team, teamIndex) => ({
        groupId: group.id,
        teamId: team.id,
        rank: teamIndex + 1,
        points: 7 - teamIndex * 2,
        played: 3,
        won: teamIndex === 0 ? 2 : 1,
        drawn: teamIndex === 1 ? 1 : 0,
        lost: teamIndex >= 2 ? 2 : 0,
        goalsFor: 5 - teamIndex,
        goalsAgainst: 2 + teamIndex,
        goalDifference: 3 - teamIndex * 2,
        rawData: { seed: true, scenario: context.scenario },
      })),
    ),
  );
}

async function seedDemoPredictions(context: SeedContext) {
  const finishedMatches = context.matches.filter((match) => match.status === "finished").slice(0, 20);
  const demoUsernames = ["admin", "demo"];

  if (finishedMatches.length > 0) {
    await db.insert(matchPredictions).values(
      finishedMatches.flatMap((match, index) =>
        demoUsernames.map((username, userIndex) => ({
          username,
          matchId: match.id,
          homeGoals: Math.max((match.homeGoals ?? 0) - userIndex, 0),
          awayGoals: match.awayGoals ?? 0,
          predictedWinnerTeamId:
            match.stage !== "group" && match.homeGoals === match.awayGoals
              ? userIndex === 0
                ? match.winnerTeamId
                : match.awayTeamId
              : null,
          createdAt: new Date(`2026-06-${String(8 + (index % 8)).padStart(2, "0")}T12:00:00-03:00`),
          updatedAt: new Date(`2026-06-${String(8 + (index % 8)).padStart(2, "0")}T12:00:00-03:00`),
        })),
      ),
    );

    await db.insert(userAllIns).values(
      demoUsernames.map((username, index) => ({
        username,
        matchId: finishedMatches[Math.min(index, finishedMatches.length - 1)].id,
      })),
    );
  }

  const argentina = context.teams.find((team) => team.name === "Argentina");
  const brasil = context.teams.find((team) => team.name === "Brasil");
  const firstGroup = context.groups[0];

  if (argentina && brasil && firstGroup) {
    await db.insert(specialPredictions).values([
      {
        username: "admin",
        type: "negative_surprise",
        scopeKey: "global",
        teamId: brasil.id,
      },
      {
        username: "demo",
        type: "negative_surprise",
        scopeKey: "global",
        teamId: argentina.id,
      },
      {
        username: "admin",
        type: "group_winner",
        scopeKey: firstGroup.id,
        groupId: firstGroup.id,
        teamId: argentina.id,
      },
      {
        username: "demo",
        type: "champion",
        scopeKey: "global",
        teamId: argentina.id,
      },
    ]);
  }
}

async function insertSyncRun(scenario: ScenarioName) {
  await db.insert(syncRuns).values({
    type: "full",
    status: "success",
    startedAt: new Date(),
    finishedAt: new Date(),
    metadata: { seed: true, scenario },
  });
}

function buildKickoffDate(index: number): Date {
  const dayOffset = Math.floor(index / 4);
  const hour = [13, 16, 19, 22][index % 4];
  const argentinaMidnight = new Date("2026-06-11T00:00:00-03:00").getTime();
  return new Date(argentinaMidnight + dayOffset * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000);
}

function getGroupResultForIndex(index: number, scenario: ScenarioName) {
  const finishedCount =
    scenario === "group-stage-mid"
      ? 24
      : isAtLeast(scenario, "group-stage-finished")
        ? 72
        : 0;

  if (index >= finishedCount) {
    return null;
  }

  const results = [
    { homeGoals: 2, awayGoals: 1 },
    { homeGoals: 1, awayGoals: 1 },
    { homeGoals: 0, awayGoals: 2 },
    { homeGoals: 3, awayGoals: 0 },
  ];

  return results[index % results.length];
}

function getKnockoutResultForIndex(index: number) {
  const results = [
    { homeGoals: 1, awayGoals: 1, winner: "home" as const },
    { homeGoals: 2, awayGoals: 0, winner: "home" as const },
    { homeGoals: 0, awayGoals: 1, winner: "away" as const },
    { homeGoals: 2, awayGoals: 2, winner: "away" as const },
  ];

  return results[index % results.length];
}

function getWinnerTeamId(homeTeamId: string, awayTeamId: string, result: { homeGoals: number; awayGoals: number }) {
  if (result.homeGoals > result.awayGoals) {
    return homeTeamId;
  }

  if (result.awayGoals > result.homeGoals) {
    return awayTeamId;
  }

  return null;
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    round_of_32: "16avos",
    round_of_16: "Octavos",
    quarter_final: "Cuartos",
    semi_final: "Semifinal",
    third_place: "Tercer puesto",
    final: "Final",
  };

  return labels[stage] ?? stage;
}

function isAtLeast(scenario: ScenarioName, checkpoint: ScenarioName): boolean {
  return scenarios.indexOf(scenario) >= scenarios.indexOf(checkpoint);
}

main()
  .then(async () => {
    await closeDbConnection();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDbConnection();
    process.exit(1);
  });
