export type MatchSide = "home" | "away";
export type MatchSign = MatchSide | "draw";

export type MatchResult = {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId: string | null;
};

export type MatchPrediction = {
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId: string | null;
};

export type MatchPoints = 0 | 1 | 3 | 5;
export type MatchScoreKind = "missing" | "exact" | "full" | "partial" | "miss" | "pending";

export type MatchScoreBreakdown = {
  points: MatchPoints;
  kind: MatchScoreKind;
  label: string;
};

export function scoreGroupMatchPrediction(
  result: MatchResult,
  prediction: MatchPrediction | null,
): MatchPoints {
  return getGroupMatchScoreBreakdown(result, prediction).points;
}

export function getGroupMatchScoreBreakdown(
  result: MatchResult,
  prediction: MatchPrediction | null,
): MatchScoreBreakdown {
  if (!prediction) {
    return { points: 0, kind: "missing", label: "Sin pronostico" };
  }

  const exactScore =
    result.homeGoals === prediction.homeGoals && result.awayGoals === prediction.awayGoals;

  if (exactScore) {
    return { points: 5, kind: "exact", label: "Exacto" };
  }

  const resultSign = getSign(result.homeGoals, result.awayGoals);
  const predictionSign = getSign(prediction.homeGoals, prediction.awayGoals);

  if (resultSign === predictionSign) {
    return { points: 3, kind: "full", label: "Signo" };
  }

  if (resultSign === "draw" || predictionSign === "draw") {
    return { points: 1, kind: "partial", label: "Parcial" };
  }

  return { points: 0, kind: "miss", label: "Incorrecto" };
}

export function scoreKnockoutMatchPrediction(
  result: MatchResult,
  prediction: MatchPrediction | null,
): MatchPoints {
  return getKnockoutMatchScoreBreakdown(result, prediction).points;
}

export function getKnockoutMatchScoreBreakdown(
  result: MatchResult,
  prediction: MatchPrediction | null,
): MatchScoreBreakdown {
  if (!prediction) {
    return { points: 0, kind: "missing", label: "Sin pronostico" };
  }

  if (!result.winnerTeamId) {
    return { points: 0, kind: "pending", label: "Pendiente" };
  }

  const predictedWinnerTeamId = getPredictedWinnerTeamId(result, prediction);
  const exactScore =
    result.homeGoals === prediction.homeGoals && result.awayGoals === prediction.awayGoals;
  const exactWinner = predictedWinnerTeamId === result.winnerTeamId;

  if (exactScore && exactWinner) {
    return { points: 5, kind: "exact", label: "Exacto" };
  }

  if (exactWinner) {
    return { points: 3, kind: "full", label: "Ganador" };
  }

  if (exactScore) {
    return { points: 1, kind: "partial", label: "Parcial" };
  }

  return { points: 0, kind: "miss", label: "Incorrecto" };
}

export function applyAllIn(basePoints: MatchPoints, isAllIn: boolean): number {
  return isAllIn ? basePoints * 3 : basePoints;
}

function getSign(homeGoals: number, awayGoals: number): MatchSign {
  if (homeGoals > awayGoals) {
    return "home";
  }

  if (awayGoals > homeGoals) {
    return "away";
  }

  return "draw";
}

function getPredictedWinnerTeamId(
  result: Pick<MatchResult, "homeTeamId" | "awayTeamId">,
  prediction: MatchPrediction,
): string | null {
  if (prediction.homeGoals > prediction.awayGoals) {
    return result.homeTeamId;
  }

  if (prediction.awayGoals > prediction.homeGoals) {
    return result.awayTeamId;
  }

  return prediction.predictedWinnerTeamId;
}
