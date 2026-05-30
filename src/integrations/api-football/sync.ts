import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  groups,
  groupTeams,
  matches,
  standings,
  syncRuns,
  teams,
  type SyncRunType,
} from "@/db/schema";
import { ApiFootballClient } from "./client";
import { getFixtureWinnerApiTeamId, mapFixtureStatus, mapRoundToStage } from "./mapper";

type SyncResult = {
  teams: number;
  groups: number;
  matches: number;
  standings: number;
};

export async function syncApiFootball(type: SyncRunType = "full"): Promise<SyncResult> {
  const [run] = await db
    .insert(syncRuns)
    .values({
      type,
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  try {
    const client = new ApiFootballClient();
    const [apiTeams, apiFixtures, apiStandings] = await Promise.all([
      client.getTeams(),
      client.getFixtures(),
      client.getStandings(),
    ]);

    const teamIdByApiId = await upsertTeams(apiTeams);
    const { groupIdByName, groupIdByApiTeamId } = await upsertGroupsAndMemberships(
      apiStandings,
      teamIdByApiId,
    );
    const matchCount = await upsertFixtures(apiFixtures, teamIdByApiId, groupIdByApiTeamId);
    const standingCount = await upsertStandings(apiStandings, teamIdByApiId, groupIdByName);
    const result = {
      teams: teamIdByApiId.size,
      groups: groupIdByName.size,
      matches: matchCount,
      standings: standingCount,
    };

    await db
      .update(syncRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        metadata: result,
      })
      .where(eq(syncRuns.id, run.id));

    return result;
  } catch (error) {
    await db
      .update(syncRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(syncRuns.id, run.id));

    throw error;
  }
}

async function upsertTeams(apiTeams: Awaited<ReturnType<ApiFootballClient["getTeams"]>>) {
  for (const item of apiTeams) {
    await db
      .insert(teams)
      .values({
        apiFootballTeamId: item.team.id,
        name: item.team.name,
        countryCode: item.team.code,
        flagUrl: item.team.logo,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: teams.apiFootballTeamId,
        set: {
          name: item.team.name,
          countryCode: item.team.code,
          flagUrl: item.team.logo,
          updatedAt: new Date(),
        },
      });
  }

  const teamRows = await db.select().from(teams);
  return new Map(
    teamRows
      .filter((team) => team.apiFootballTeamId !== null)
      .map((team) => [team.apiFootballTeamId as number, team.id]),
  );
}

async function upsertGroupsAndMemberships(
  apiStandings: Awaited<ReturnType<ApiFootballClient["getStandings"]>>,
  teamIdByApiId: Map<number, string>,
) {
  const groupNames = extractStandingsRows(apiStandings).map((row) => row.group);
  const uniqueGroupNames = [...new Set(groupNames)].sort();

  for (const groupName of uniqueGroupNames) {
    const code = getGroupCode(groupName);

    await db
      .insert(groups)
      .values({
        code,
        name: groupName,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: groups.code,
        set: {
          name: groupName,
          updatedAt: new Date(),
        },
      });
  }

  const groupRows = await db.select().from(groups);
  const groupIdByName = new Map(
    groupRows.map((group) => [group.name, group.id] as const),
  );
  const groupIdByApiTeamId = new Map<number, string>();

  for (const row of extractStandingsRows(apiStandings)) {
    const groupId = groupIdByName.get(row.group);
    const teamId = teamIdByApiId.get(row.team.id);

    if (!groupId || !teamId) {
      continue;
    }

    groupIdByApiTeamId.set(row.team.id, groupId);

    await db
      .insert(groupTeams)
      .values({
        groupId,
        teamId,
        positionSeed: row.rank,
      })
      .onConflictDoUpdate({
        target: [groupTeams.groupId, groupTeams.teamId],
        set: {
          positionSeed: row.rank,
        },
      });
  }

  return { groupIdByName, groupIdByApiTeamId };
}

async function upsertFixtures(
  apiFixtures: Awaited<ReturnType<ApiFootballClient["getFixtures"]>>,
  teamIdByApiId: Map<number, string>,
  groupIdByApiTeamId: Map<number, string>,
) {
  for (const fixture of apiFixtures) {
    const homeApiId = fixture.teams.home.id;
    const awayApiId = fixture.teams.away.id;
    const homeTeamId = homeApiId ? (teamIdByApiId.get(homeApiId) ?? null) : null;
    const awayTeamId = awayApiId ? (teamIdByApiId.get(awayApiId) ?? null) : null;
    const winnerApiTeamId = getFixtureWinnerApiTeamId(fixture);
    const stage = mapRoundToStage(fixture.league.round);
    const groupId = stage === "group" && homeApiId ? (groupIdByApiTeamId.get(homeApiId) ?? null) : null;

    await db
      .insert(matches)
      .values({
        apiFootballFixtureId: fixture.fixture.id,
        stage,
        roundName: fixture.league.round,
        groupId,
        homeTeamId,
        awayTeamId,
        kickoffAt: new Date(fixture.fixture.date),
        venueName: fixture.fixture.venue?.name ?? null,
        venueCity: fixture.fixture.venue?.city ?? null,
        status: mapFixtureStatus(fixture.fixture.status.short),
        homeGoals: fixture.goals.home,
        awayGoals: fixture.goals.away,
        winnerTeamId: winnerApiTeamId ? (teamIdByApiId.get(winnerApiTeamId) ?? null) : null,
        rawStatus: fixture.fixture.status.short,
        rawData: fixture,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: matches.apiFootballFixtureId,
        set: {
          stage,
          roundName: fixture.league.round,
          groupId,
          homeTeamId,
          awayTeamId,
          kickoffAt: new Date(fixture.fixture.date),
          venueName: fixture.fixture.venue?.name ?? null,
          venueCity: fixture.fixture.venue?.city ?? null,
          status: mapFixtureStatus(fixture.fixture.status.short),
          homeGoals: fixture.goals.home,
          awayGoals: fixture.goals.away,
          winnerTeamId: winnerApiTeamId ? (teamIdByApiId.get(winnerApiTeamId) ?? null) : null,
          rawStatus: fixture.fixture.status.short,
          rawData: fixture,
          updatedAt: new Date(),
        },
      });
  }

  return apiFixtures.length;
}

async function upsertStandings(
  apiStandings: Awaited<ReturnType<ApiFootballClient["getStandings"]>>,
  teamIdByApiId: Map<number, string>,
  groupIdByName: Map<string, string>,
) {
  let count = 0;

  for (const row of extractStandingsRows(apiStandings)) {
    const groupId = groupIdByName.get(row.group);
    const teamId = teamIdByApiId.get(row.team.id);

    if (!groupId || !teamId) {
      continue;
    }

    await db
      .insert(standings)
      .values({
        groupId,
        teamId,
        rank: row.rank,
        points: row.points,
        played: row.all.played,
        won: row.all.win,
        drawn: row.all.draw,
        lost: row.all.lose,
        goalsFor: row.all.goals.for,
        goalsAgainst: row.all.goals.against,
        goalDifference: row.goalsDiff,
        rawData: row,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [standings.groupId, standings.teamId],
        set: {
          rank: row.rank,
          points: row.points,
          played: row.all.played,
          won: row.all.win,
          drawn: row.all.draw,
          lost: row.all.lose,
          goalsFor: row.all.goals.for,
          goalsAgainst: row.all.goals.against,
          goalDifference: row.goalsDiff,
          rawData: row,
          syncedAt: new Date(),
        },
      });
    count += 1;
  }

  return count;
}

function extractStandingsRows(apiStandings: Awaited<ReturnType<ApiFootballClient["getStandings"]>>) {
  return apiStandings.flatMap((item) => item.league.standings.flat());
}

function getGroupCode(groupName: string): string {
  const match = groupName.match(/Group\s+([A-Z])/i);
  return match?.[1]?.toUpperCase() ?? groupName;
}
