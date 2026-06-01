import type { FootballDataMatch } from "./client";
import { getGoalsWithoutPenaltyShootout } from "./mapper";

export type LocalStandingTeam = {
  groupCode: string;
  teamId: string;
  teamName: string;
  seed: number;
};

export type LocalStandingMatch = {
  groupCode: string | null;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
};

export type LocalStandingRow = {
  groupCode: string;
  teamId: string;
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

type MutableStanding = Omit<LocalStandingRow, "rank" | "goalDifference"> & {
  seed: number;
  teamName: string;
};

export function calculateLocalStandings(
  teams: LocalStandingTeam[],
  matches: LocalStandingMatch[],
): LocalStandingRow[] {
  const rows = new Map<string, MutableStanding>();

  for (const team of teams) {
    rows.set(`${team.groupCode}:${team.teamId}`, {
      groupCode: team.groupCode,
      teamId: team.teamId,
      seed: team.seed,
      teamName: team.teamName,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  for (const match of matches) {
    if (
      match.status !== "finished" ||
      !match.groupCode ||
      !match.homeTeamId ||
      !match.awayTeamId ||
      match.homeGoals === null ||
      match.awayGoals === null
    ) {
      continue;
    }

    const home = rows.get(`${match.groupCode}:${match.homeTeamId}`);
    const away = rows.get(`${match.groupCode}:${match.awayTeamId}`);

    if (!home || !away) {
      continue;
    }

    applyMatch(home, match.homeGoals, match.awayGoals);
    applyMatch(away, match.awayGoals, match.homeGoals);
  }

  const byGroup = new Map<string, MutableStanding[]>();

  for (const row of rows.values()) {
    const groupRows = byGroup.get(row.groupCode) ?? [];
    groupRows.push(row);
    byGroup.set(row.groupCode, groupRows);
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([groupCode, groupRows]) =>
      groupRows
        .sort(compareStandings)
        .map((row, index) => ({
          groupCode,
          teamId: row.teamId,
          rank: index + 1,
          points: row.points,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalsFor - row.goalsAgainst,
        })),
    );
}

export function toLocalStandingMatch(
  match: FootballDataMatch,
  teamIdByExternalId: Map<number, string>,
): LocalStandingMatch {
  const goals = getGoalsWithoutPenaltyShootout(match);

  return {
    groupCode: match.group ? match.group.replace("GROUP_", "") : null,
    status: match.status === "FINISHED" ? "finished" : "scheduled",
    homeTeamId: match.homeTeam.id ? (teamIdByExternalId.get(match.homeTeam.id) ?? null) : null,
    awayTeamId: match.awayTeam.id ? (teamIdByExternalId.get(match.awayTeam.id) ?? null) : null,
    homeGoals: goals.home,
    awayGoals: goals.away,
  };
}

function applyMatch(row: MutableStanding, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

function compareStandings(a: MutableStanding, b: MutableStanding) {
  const pointsDiff = b.points - a.points;

  if (pointsDiff !== 0) {
    return pointsDiff;
  }

  const goalDiff = b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);

  if (goalDiff !== 0) {
    return goalDiff;
  }

  const goalsForDiff = b.goalsFor - a.goalsFor;

  if (goalsForDiff !== 0) {
    return goalsForDiff;
  }

  return a.seed - b.seed || a.teamName.localeCompare(b.teamName);
}
