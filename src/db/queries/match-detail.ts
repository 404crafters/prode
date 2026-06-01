import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { matches, matchPredictions, teams, userAllIns } from "@/db/schema";
import { areMatchPredictionsVisible, getMatchPredictionDeadline, isMatchPredictionOpen } from "@/domain/deadlines";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime } from "@/lib/date";
import {
  applyAllIn,
  getGroupMatchScoreBreakdown,
  getKnockoutMatchScoreBreakdown,
} from "@/domain/scoring";
import { getActiveUsers } from "./users";

export type MatchDetail = {
  id: string;
  stage: string;
  roundName: string | null;
  homeTeam: { id: string; name: string; flagUrl: string | null } | null;
  awayTeam: { id: string; name: string; flagUrl: string | null } | null;
  kickoffLabel: string;
  deadlineLabel: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: string | null;
  winnerTeamName: string | null;
  winnerTeamFlagUrl: string | null;
  isPredictionOpen: boolean;
  arePredictionsVisible: boolean;
  isAllIn: boolean;
  canSetAllIn: boolean;
  ownPrediction: {
    homeGoals: number;
    awayGoals: number;
    predictedWinnerTeamId: string | null;
    predictedWinnerTeamName: string | null;
    predictedWinnerTeamFlagUrl: string | null;
    scoreLabel: string | null;
    basePoints: number | null;
    finalPoints: number | null;
    isScored: boolean;
  } | null;
  visiblePredictions: {
    username: string;
    displayName: string;
    homeGoals: number | null;
    awayGoals: number | null;
    predictedWinnerTeamName: string | null;
    predictedWinnerTeamFlagUrl: string | null;
    scoreLabel: string | null;
    basePoints: number | null;
    finalPoints: number | null;
    isAllIn: boolean;
  }[];
};

export async function getMatchDetail(matchId: string, username: string): Promise<MatchDetail | null> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

  if (!match) {
    return null;
  }

  const [teamRows, predictionRows, userRows] = await Promise.all([
    db.select().from(teams),
    db.select().from(matchPredictions).where(eq(matchPredictions.matchId, match.id)),
    getActiveUsers(),
  ]);
  const allInRows = await db.select().from(userAllIns);
  const ownAllIn = allInRows.find((row) => row.username === username) ?? null;

  const now = getNow();
  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const predictionsByUsername = new Map(predictionRows.map((prediction) => [prediction.username, prediction]));
  const ownPrediction = predictionsByUsername.get(username) ?? null;
  const visible = areMatchPredictionsVisible(match, now);
  const currentAllInMatch = ownAllIn
    ? await db.select().from(matches).where(eq(matches.id, ownAllIn.matchId)).limit(1)
    : [];
  const currentAllInOpen = currentAllInMatch[0]
    ? isMatchPredictionOpen(currentAllInMatch[0], now)
    : true;
  const ownScore = getScoreForMatch(match, ownPrediction);
  const ownIsAllIn = ownAllIn?.matchId === match.id;

  return {
    id: match.id,
    stage: match.stage,
    roundName: match.roundName,
    homeTeam: match.homeTeamId
      ? {
          id: match.homeTeamId,
          name: teamsById.get(match.homeTeamId)?.name ?? "TBD",
          flagUrl: teamsById.get(match.homeTeamId)?.flagUrl ?? null,
        }
      : null,
    awayTeam: match.awayTeamId
      ? {
          id: match.awayTeamId,
          name: teamsById.get(match.awayTeamId)?.name ?? "TBD",
          flagUrl: teamsById.get(match.awayTeamId)?.flagUrl ?? null,
        }
      : null,
    kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
    deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(match)),
    status: match.status,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    winnerTeamId: match.winnerTeamId,
    winnerTeamName: match.winnerTeamId ? (teamsById.get(match.winnerTeamId)?.name ?? null) : null,
    winnerTeamFlagUrl: match.winnerTeamId ? (teamsById.get(match.winnerTeamId)?.flagUrl ?? null) : null,
    isPredictionOpen: isMatchPredictionOpen(match, now),
    arePredictionsVisible: visible,
    isAllIn: ownIsAllIn,
    canSetAllIn: isMatchPredictionOpen(match, now) && currentAllInOpen,
    ownPrediction: ownPrediction
      ? {
          homeGoals: ownPrediction.homeGoals,
          awayGoals: ownPrediction.awayGoals,
          predictedWinnerTeamId: ownPrediction.predictedWinnerTeamId,
          predictedWinnerTeamName: ownPrediction.predictedWinnerTeamId
            ? (teamsById.get(ownPrediction.predictedWinnerTeamId)?.name ?? null)
            : null,
          predictedWinnerTeamFlagUrl: ownPrediction.predictedWinnerTeamId
            ? (teamsById.get(ownPrediction.predictedWinnerTeamId)?.flagUrl ?? null)
            : null,
          scoreLabel: ownScore?.label ?? null,
          basePoints: ownScore?.points ?? null,
          finalPoints: ownScore ? applyAllIn(ownScore.points, ownIsAllIn) : null,
          isScored: Boolean(ownScore),
        }
      : null,
    visiblePredictions: visible
      ? userRows.map((user) => {
          const prediction = predictionsByUsername.get(user.username);
          const userAllIn = allInRows.some((row) => row.username === user.username && row.matchId === match.id);
          const score = getScoreForMatch(match, prediction ?? null);
          return {
            username: user.username,
            displayName: user.displayName,
            homeGoals: prediction?.homeGoals ?? null,
            awayGoals: prediction?.awayGoals ?? null,
            predictedWinnerTeamName: prediction?.predictedWinnerTeamId
              ? (teamsById.get(prediction.predictedWinnerTeamId)?.name ?? null)
              : null,
            predictedWinnerTeamFlagUrl: prediction?.predictedWinnerTeamId
              ? (teamsById.get(prediction.predictedWinnerTeamId)?.flagUrl ?? null)
              : null,
            scoreLabel: score?.label ?? null,
            basePoints: score?.points ?? null,
            finalPoints: score ? applyAllIn(score.points, userAllIn) : null,
            isAllIn: userAllIn,
          };
        })
      : [],
  };
}

export async function getPredictionMatch(matchId: string) {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  return match ?? null;
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
