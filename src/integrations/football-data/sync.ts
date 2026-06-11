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
import { FootballDataClient, type FootballDataMatch, type FootballDataStandingsResponse } from "./client";
import {
  getGoalsWithoutPenaltyShootout,
  getWinnerExternalTeamId,
  mapFootballDataGroupCode,
  mapFootballDataStage,
  mapFootballDataStatus,
  mapTeamDisplayName,
} from "./mapper";
import {
  calculateLocalStandings,
  extractApiTotalStandings,
  toLocalStandingMatch,
  type LocalStandingRow,
  type LocalStandingTeam,
  type TeamGroupInfo,
} from "./standings";

type SyncResult = {
  provider: "football-data";
  teams: number;
  groups: number;
  matches: number;
  standings: number;
};

type GroupMembership = {
  groupCode: string;
  externalTeamId: number;
  seed: number;
};

export async function syncFootballData(type: SyncRunType = "full"): Promise<SyncResult> {
  const [run] = await db
    .insert(syncRuns)
    .values({
      type,
      status: "running",
      startedAt: new Date(),
      metadata: { provider: "football-data" },
    })
    .returning();

  try {
    const client = new FootballDataClient();
    const competition = await client.getCompetition();
    const [apiTeams, apiMatches, apiStandings] = await Promise.all([
      client.getTeams(),
      client.getMatches(competition.currentSeason.startDate, competition.currentSeason.endDate),
      client.getStandings(),
    ]);

    const teamIdByExternalId = await upsertTeams(apiTeams.teams);
    const memberships = extractGroupMemberships(apiMatches.matches);
    const groupIdByCode = await upsertGroupsAndMemberships(memberships, teamIdByExternalId);
    const matchCount = await upsertMatches(apiMatches.matches, teamIdByExternalId, groupIdByCode);
    const groupByExternalTeamId = buildGroupByExternalTeamId(memberships);
    // Prefer the provider standings (authoritative and ahead of the lagging
    // per-match scores): first a per-group feed, then the flat 2026 TOTAL table
    // mapped back to groups. Only fall back to recomputing from fixtures when
    // the standings endpoint returns nothing usable.
    const groupedStandings = extractGroupedStandings(apiStandings, teamIdByExternalId);
    const apiStandingRows =
      groupedStandings.length > 0
        ? groupedStandings
        : extractApiTotalStandings(apiStandings, teamIdByExternalId, groupByExternalTeamId);
    const standingRows =
      apiStandingRows.length > 0
        ? apiStandingRows
        : calculateLocalStandings(
            toLocalStandingTeams(memberships, teamIdByExternalId),
            apiMatches.matches.map((match) => toLocalStandingMatch(match, teamIdByExternalId)),
          );
    const standingCount = await upsertStandings(standingRows, groupIdByCode);
    const result: SyncResult = {
      provider: "football-data",
      teams: teamIdByExternalId.size,
      groups: groupIdByCode.size,
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

async function upsertTeams(apiTeams: { id: number; name: string; tla: string | null; crest: string | null }[]) {
  for (const team of apiTeams) {
    await db
      .insert(teams)
      .values({
        externalTeamId: team.id,
        name: mapTeamDisplayName(team.name),
        countryCode: team.tla,
        flagUrl: team.crest,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: teams.externalTeamId,
        set: {
          name: mapTeamDisplayName(team.name),
          countryCode: team.tla,
          flagUrl: team.crest,
          updatedAt: new Date(),
        },
      });
  }

  const teamRows = await db.select().from(teams);
  return new Map(
    teamRows
      .filter((team) => team.externalTeamId !== null)
      .map((team) => [team.externalTeamId as number, team.id]),
  );
}

async function upsertGroupsAndMemberships(
  memberships: GroupMembership[],
  teamIdByExternalId: Map<number, string>,
) {
  const groupCodes = [...new Set(memberships.map((membership) => membership.groupCode))].sort();

  for (const code of groupCodes) {
    await db
      .insert(groups)
      .values({
        code,
        name: `Grupo ${code}`,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: groups.code,
        set: {
          name: `Grupo ${code}`,
          updatedAt: new Date(),
        },
      });
  }

  const groupRows = await db.select().from(groups);
  const groupIdByCode = new Map(groupRows.map((group) => [group.code, group.id] as const));

  for (const membership of memberships) {
    const groupId = groupIdByCode.get(membership.groupCode);
    const teamId = teamIdByExternalId.get(membership.externalTeamId);

    if (!groupId || !teamId) {
      continue;
    }

    await db
      .insert(groupTeams)
      .values({
        groupId,
        teamId,
        positionSeed: membership.seed,
      })
      .onConflictDoUpdate({
        target: [groupTeams.groupId, groupTeams.teamId],
        set: {
          positionSeed: membership.seed,
        },
      });
  }

  return groupIdByCode;
}

async function upsertMatches(
  apiMatches: FootballDataMatch[],
  teamIdByExternalId: Map<number, string>,
  groupIdByCode: Map<string, string>,
) {
  for (const match of apiMatches) {
    const stage = mapFootballDataStage(match.stage);
    const groupCode = mapFootballDataGroupCode(match.group);
    const groupId = groupCode ? (groupIdByCode.get(groupCode) ?? null) : null;
    const homeTeamId = match.homeTeam.id ? (teamIdByExternalId.get(match.homeTeam.id) ?? null) : null;
    const awayTeamId = match.awayTeam.id ? (teamIdByExternalId.get(match.awayTeam.id) ?? null) : null;
    const winnerExternalTeamId = getWinnerExternalTeamId(match);
    const winnerTeamId = winnerExternalTeamId ? (teamIdByExternalId.get(winnerExternalTeamId) ?? null) : null;
    const goals = getGoalsWithoutPenaltyShootout(match);

    await db
      .insert(matches)
      .values({
        externalFixtureId: match.id,
        stage,
        roundName: match.stage,
        groupId,
        homeTeamId,
        awayTeamId,
        kickoffAt: new Date(match.utcDate),
        venueName: null,
        venueCity: null,
        status: mapFootballDataStatus(match.status),
        homeGoals: goals.home,
        awayGoals: goals.away,
        winnerTeamId,
        rawStatus: match.status,
        rawData: { provider: "football-data", match },
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: matches.externalFixtureId,
        set: {
          stage,
          roundName: match.stage,
          groupId,
          homeTeamId,
          awayTeamId,
          kickoffAt: new Date(match.utcDate),
          venueName: null,
          venueCity: null,
          status: mapFootballDataStatus(match.status),
          homeGoals: goals.home,
          awayGoals: goals.away,
          winnerTeamId,
          rawStatus: match.status,
          rawData: { provider: "football-data", match },
          updatedAt: new Date(),
        },
      });
  }

  return apiMatches.length;
}

async function upsertStandings(rows: LocalStandingRow[], groupIdByCode: Map<string, string>) {
  let count = 0;

  for (const row of rows) {
    const groupId = groupIdByCode.get(row.groupCode);

    if (!groupId) {
      continue;
    }

    await db
      .insert(standings)
      .values({
        groupId,
        teamId: row.teamId,
        rank: row.rank,
        points: row.points,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        rawData: { provider: "football-data", source: "calculated", row },
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [standings.groupId, standings.teamId],
        set: {
          rank: row.rank,
          points: row.points,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalDifference,
          rawData: { provider: "football-data", source: "calculated", row },
          syncedAt: new Date(),
        },
      });
    count += 1;
  }

  return count;
}

function extractGroupMemberships(apiMatches: FootballDataMatch[]): GroupMembership[] {
  const memberships = new Map<string, GroupMembership>();

  for (const match of [...apiMatches].sort((a, b) => a.utcDate.localeCompare(b.utcDate))) {
    if (match.stage !== "GROUP_STAGE") {
      continue;
    }

    const groupCode = mapFootballDataGroupCode(match.group);

    if (!groupCode) {
      continue;
    }

    for (const externalTeamId of [match.homeTeam.id, match.awayTeam.id]) {
      if (!externalTeamId) {
        continue;
      }

      const key = `${groupCode}:${externalTeamId}`;

      if (!memberships.has(key)) {
        const seed = [...memberships.values()].filter((membership) => membership.groupCode === groupCode).length + 1;
        memberships.set(key, { groupCode, externalTeamId, seed });
      }
    }
  }

  return [...memberships.values()].sort(
    (a, b) => a.groupCode.localeCompare(b.groupCode) || a.seed - b.seed,
  );
}

function buildGroupByExternalTeamId(memberships: GroupMembership[]): Map<number, TeamGroupInfo> {
  const map = new Map<number, TeamGroupInfo>();

  for (const membership of memberships) {
    if (!map.has(membership.externalTeamId)) {
      map.set(membership.externalTeamId, {
        groupCode: membership.groupCode,
        seed: membership.seed,
      });
    }
  }

  return map;
}

function toLocalStandingTeams(
  memberships: GroupMembership[],
  teamIdByExternalId: Map<number, string>,
): LocalStandingTeam[] {
  return memberships
    .map((membership) => {
      const teamId = teamIdByExternalId.get(membership.externalTeamId);

      return teamId
        ? {
            groupCode: membership.groupCode,
            teamId,
            teamName: String(membership.externalTeamId),
            seed: membership.seed,
          }
        : null;
    })
    .filter((team): team is LocalStandingTeam => Boolean(team));
}

function extractGroupedStandings(
  apiStandings: FootballDataStandingsResponse,
  teamIdByExternalId: Map<number, string>,
): LocalStandingRow[] {
  return apiStandings.standings
    .filter((standing) => standing.type === "TOTAL" && Boolean(standing.group))
    .flatMap((standing) => {
      const groupCode = mapFootballDataGroupCode(standing.group);

      if (!groupCode) {
        return [];
      }

      return standing.table
        .map((row) => {
          const teamId = teamIdByExternalId.get(row.team.id);

          return teamId
            ? {
                groupCode,
                teamId,
                rank: row.position,
                points: row.points,
                played: row.playedGames,
                won: row.won,
                drawn: row.draw,
                lost: row.lost,
                goalsFor: row.goalsFor,
                goalsAgainst: row.goalsAgainst,
                goalDifference: row.goalDifference,
              }
            : null;
        })
        .filter((row): row is LocalStandingRow => Boolean(row));
    });
}
