import { eq } from "drizzle-orm";
import { users } from "@/config/users";
import { db } from "@/db/client";
import { matches, matchPredictions, teams } from "@/db/schema";
import { areMatchPredictionsVisible, getMatchPredictionDeadline, isMatchPredictionOpen } from "@/domain/deadlines";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime } from "@/lib/date";

export type MatchDetail = {
  id: string;
  stage: string;
  roundName: string | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  kickoffLabel: string;
  deadlineLabel: string;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: string | null;
  isPredictionOpen: boolean;
  arePredictionsVisible: boolean;
  ownPrediction: {
    homeGoals: number;
    awayGoals: number;
    predictedWinnerTeamId: string | null;
  } | null;
  visiblePredictions: {
    username: string;
    displayName: string;
    homeGoals: number | null;
    awayGoals: number | null;
    predictedWinnerTeamName: string | null;
  }[];
};

export async function getMatchDetail(matchId: string, username: string): Promise<MatchDetail | null> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

  if (!match) {
    return null;
  }

  const [teamRows, predictionRows] = await Promise.all([
    db.select().from(teams),
    db.select().from(matchPredictions).where(eq(matchPredictions.matchId, match.id)),
  ]);

  const now = getNow();
  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const predictionsByUsername = new Map(predictionRows.map((prediction) => [prediction.username, prediction]));
  const ownPrediction = predictionsByUsername.get(username) ?? null;
  const visible = areMatchPredictionsVisible(match, now);

  return {
    id: match.id,
    stage: match.stage,
    roundName: match.roundName,
    homeTeam: match.homeTeamId
      ? {
          id: match.homeTeamId,
          name: teamsById.get(match.homeTeamId)?.name ?? "TBD",
        }
      : null,
    awayTeam: match.awayTeamId
      ? {
          id: match.awayTeamId,
          name: teamsById.get(match.awayTeamId)?.name ?? "TBD",
        }
      : null,
    kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
    deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(match)),
    status: match.status,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    winnerTeamId: match.winnerTeamId,
    isPredictionOpen: isMatchPredictionOpen(match, now),
    arePredictionsVisible: visible,
    ownPrediction: ownPrediction
      ? {
          homeGoals: ownPrediction.homeGoals,
          awayGoals: ownPrediction.awayGoals,
          predictedWinnerTeamId: ownPrediction.predictedWinnerTeamId,
        }
      : null,
    visiblePredictions: visible
      ? users.map((user) => {
          const prediction = predictionsByUsername.get(user.username);
          return {
            username: user.username,
            displayName: user.displayName,
            homeGoals: prediction?.homeGoals ?? null,
            awayGoals: prediction?.awayGoals ?? null,
            predictedWinnerTeamName: prediction?.predictedWinnerTeamId
              ? (teamsById.get(prediction.predictedWinnerTeamId)?.name ?? null)
              : null,
          };
        })
      : [],
  };
}

export async function getPredictionMatch(matchId: string) {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  return match ?? null;
}
