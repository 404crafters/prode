import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { matches, teams, userAllIns } from "@/db/schema";
import { getMatchPredictionDeadline, isMatchPredictionOpen } from "@/domain/deadlines";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime } from "@/lib/date";

export type AllInView = {
  current: {
    matchId: string;
    label: string;
    kickoffLabel: string;
    deadlineLabel: string;
    isLocked: boolean;
  } | null;
  canMove: boolean;
  openMatches: {
    id: string;
    label: string;
    kickoffLabel: string;
    deadlineLabel: string;
    isCurrent: boolean;
  }[];
};

export async function getAllInView(username: string): Promise<AllInView> {
  const now = getNow();
  const [matchRows, teamRows, allInRows] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.kickoffAt), asc(matches.apiFootballFixtureId)),
    db.select().from(teams),
    db.select().from(userAllIns).where(eq(userAllIns.username, username)),
  ]);
  const teamsById = new Map(teamRows.map((team) => [team.id, team.name]));
  const currentAllIn = allInRows[0] ?? null;
  const currentMatch = currentAllIn
    ? (matchRows.find((match) => match.id === currentAllIn.matchId) ?? null)
    : null;
  const currentOpen = currentMatch ? isMatchPredictionOpen(currentMatch, now) : true;

  return {
    current: currentMatch
      ? {
          matchId: currentMatch.id,
          label: getMatchLabel(currentMatch, teamsById),
          kickoffLabel: formatArgentinaDateTime(currentMatch.kickoffAt),
          deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(currentMatch)),
          isLocked: !currentOpen,
        }
      : null,
    canMove: currentOpen,
    openMatches: matchRows
      .filter((match) => match.homeTeamId && match.awayTeamId && isMatchPredictionOpen(match, now))
      .map((match) => ({
        id: match.id,
        label: getMatchLabel(match, teamsById),
        kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
        deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(match)),
        isCurrent: currentMatch?.id === match.id,
      })),
  };
}

function getMatchLabel(match: (typeof matches.$inferSelect), teamsById: Map<string, string>) {
  const homeName = match.homeTeamId ? (teamsById.get(match.homeTeamId) ?? "TBD") : "TBD";
  const awayName = match.awayTeamId ? (teamsById.get(match.awayTeamId) ?? "TBD") : "TBD";
  return `${homeName} vs ${awayName}`;
}
