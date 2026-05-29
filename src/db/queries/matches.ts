import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { groups, matches, teams } from "@/db/schema";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime } from "@/lib/date";
import { getMatchPredictionDeadline, isMatchPredictionOpen } from "@/domain/deadlines";

export type MatchListItem = {
  id: string;
  stage: string;
  roundName: string | null;
  groupCode: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  kickoffAt: Date;
  kickoffLabel: string;
  deadlineLabel: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamName: string | null;
  isPredictionOpen: boolean;
};

export async function getMatchList(): Promise<MatchListItem[]> {
  const now = getNow();
  const [matchRows, teamRows, groupRows] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.kickoffAt), asc(matches.apiFootballFixtureId)),
    db.select().from(teams),
    db.select().from(groups),
  ]);

  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const groupsById = new Map(groupRows.map((group) => [group.id, group]));

  return matchRows.map((match) => ({
    id: match.id,
    stage: match.stage,
    roundName: match.roundName,
    groupCode: match.groupId ? (groupsById.get(match.groupId)?.code ?? null) : null,
    homeTeamName: match.homeTeamId ? (teamsById.get(match.homeTeamId)?.name ?? null) : null,
    awayTeamName: match.awayTeamId ? (teamsById.get(match.awayTeamId)?.name ?? null) : null,
    kickoffAt: match.kickoffAt,
    kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
    deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(match)),
    status: match.status,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    winnerTeamName: match.winnerTeamId ? (teamsById.get(match.winnerTeamId)?.name ?? null) : null,
    isPredictionOpen: isMatchPredictionOpen(match, now),
  }));
}
