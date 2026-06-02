import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { withDbTimeout } from "@/db/with-timeout";
import { groups, matches, matchPredictions, teams, userAllIns } from "@/db/schema";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime } from "@/lib/date";
import { getMatchPredictionDeadline, isMatchPredictionOpen } from "@/domain/deadlines";
import {
  applyAllIn,
  getGroupMatchScoreBreakdown,
  getKnockoutMatchScoreBreakdown,
} from "@/domain/scoring";

export type MatchListItem = {
  id: string;
  stage: string;
  roundName: string | null;
  groupId: string | null;
  groupCode: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamFlagUrl: string | null;
  awayTeamFlagUrl: string | null;
  kickoffAt: Date;
  kickoffLabel: string;
  deadlineLabel: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamName: string | null;
  isPredictionOpen: boolean;
  hasPrediction: boolean;
  predictionLabel: string | null;
  isAllIn: boolean;
  points: number | null;
  scoreLabel: string | null;
};

export async function getMatchList(username: string): Promise<MatchListItem[]> {
  const now = getNow();
  const [matchRows, teamRows, groupRows, predictionRows, allInRows] = await withDbTimeout(
    Promise.all([
      db.select().from(matches).orderBy(asc(matches.kickoffAt), asc(matches.externalFixtureId)),
      db.select().from(teams),
      db.select().from(groups),
      db.select().from(matchPredictions).where(eq(matchPredictions.username, username)),
      db.select().from(userAllIns).where(eq(userAllIns.username, username)),
    ]),
    "getMatchList",
  );

  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const groupsById = new Map(groupRows.map((group) => [group.id, group]));
  const predictionsByMatchId = new Map(
    predictionRows.map((prediction) => [prediction.matchId, prediction]),
  );
  const allInMatchId = allInRows[0]?.matchId ?? null;

  return matchRows.map((match) => {
    const prediction = predictionsByMatchId.get(match.id) ?? null;
    const isAllIn = allInMatchId === match.id;
    const score = getScoreForMatch(match, prediction);

    return {
      id: match.id,
      stage: match.stage,
      roundName: match.roundName,
      groupId: match.groupId,
      groupCode: match.groupId ? (groupsById.get(match.groupId)?.code ?? null) : null,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeTeamName: match.homeTeamId ? (teamsById.get(match.homeTeamId)?.name ?? null) : null,
      awayTeamName: match.awayTeamId ? (teamsById.get(match.awayTeamId)?.name ?? null) : null,
      homeTeamFlagUrl: match.homeTeamId ? (teamsById.get(match.homeTeamId)?.flagUrl ?? null) : null,
      awayTeamFlagUrl: match.awayTeamId ? (teamsById.get(match.awayTeamId)?.flagUrl ?? null) : null,
      kickoffAt: match.kickoffAt,
      kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
      deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(match)),
      status: match.status,
      homeGoals: match.homeGoals,
      awayGoals: match.awayGoals,
      winnerTeamName: match.winnerTeamId ? (teamsById.get(match.winnerTeamId)?.name ?? null) : null,
      isPredictionOpen: isMatchPredictionOpen(match, now),
      hasPrediction: Boolean(prediction),
      predictionLabel: prediction ? `${prediction.homeGoals} - ${prediction.awayGoals}` : null,
      isAllIn,
      points: score ? applyAllIn(score.points, isAllIn) : null,
      scoreLabel: score?.label ?? null,
    };
  });
}

function getScoreForMatch(
  match: (typeof matches.$inferSelect),
  prediction: (typeof matchPredictions.$inferSelect) | null,
) {
  if (
    match.status !== "finished" ||
    match.homeGoals === null ||
    match.awayGoals === null ||
    !match.homeTeamId ||
    !match.awayTeamId
  ) {
    return null;
  }

  const result = {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    winnerTeamId: match.winnerTeamId,
  };

  return match.stage === "group"
    ? getGroupMatchScoreBreakdown(result, prediction)
    : getKnockoutMatchScoreBreakdown(result, prediction);
}
