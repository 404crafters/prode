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

export function scoreGroupMatchPrediction(
  result: MatchResult,
  prediction: MatchPrediction | null,
): MatchPoints {
  if (!prediction) {
    return 0;
  }

  const exactScore =
    result.homeGoals === prediction.homeGoals && result.awayGoals === prediction.awayGoals;

  if (exactScore) {
    return 5;
  }

  const resultSign = getSign(result.homeGoals, result.awayGoals);
  const predictionSign = getSign(prediction.homeGoals, prediction.awayGoals);

  if (resultSign === predictionSign) {
    return 3;
  }

  if (resultSign === "draw" || predictionSign === "draw") {
    return 1;
  }

  return 0;
}

export function scoreKnockoutMatchPrediction(
  result: MatchResult,
  prediction: MatchPrediction | null,
): MatchPoints {
  if (!prediction || !result.winnerTeamId) {
    return 0;
  }

  const predictedWinnerTeamId = getPredictedWinnerTeamId(result, prediction);
  const exactScore =
    result.homeGoals === prediction.homeGoals && result.awayGoals === prediction.awayGoals;
  const exactWinner = predictedWinnerTeamId === result.winnerTeamId;

  if (exactScore && exactWinner) {
    return 5;
  }

  if (exactWinner) {
    return 3;
  }

  if (exactScore) {
    return 1;
  }

  return 0;
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
