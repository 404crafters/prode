export type PredictionMatch = {
  id: string;
  stage: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type MatchPredictionInput = {
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId: string | null;
};

export function validateMatchPredictionInput(
  match: PredictionMatch,
  input: MatchPredictionInput,
): string | null {
  if (!match.homeTeamId || !match.awayTeamId) {
    return "El partido todavia no tiene equipos definidos.";
  }

  if (!Number.isInteger(input.homeGoals) || !Number.isInteger(input.awayGoals)) {
    return "Los goles deben ser numeros enteros.";
  }

  if (input.homeGoals < 0 || input.awayGoals < 0) {
    return "Los goles no pueden ser negativos.";
  }

  if (match.stage === "group") {
    return null;
  }

  if (input.homeGoals === input.awayGoals) {
    if (!input.predictedWinnerTeamId) {
      return "En eliminatorias tenes que elegir ganador si el score es empate.";
    }

    if (![match.homeTeamId, match.awayTeamId].includes(input.predictedWinnerTeamId)) {
      return "El ganador debe ser uno de los equipos del partido.";
    }
  }

  return null;
}

export function normalizePredictedWinner(
  match: PredictionMatch,
  input: MatchPredictionInput,
): string | null {
  if (match.stage === "group") {
    return null;
  }

  if (input.homeGoals > input.awayGoals) {
    return null;
  }

  if (input.awayGoals > input.homeGoals) {
    return null;
  }

  return input.predictedWinnerTeamId;
}
