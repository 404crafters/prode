import { db } from "@/db/client";
import { withDbTimeout } from "@/db/with-timeout";
import {
  matches,
  matchPredictions,
  groups,
  specialPredictions,
  standings,
  teams,
  userAllIns,
} from "@/db/schema";
import {
  applyAllIn,
  getGroupMatchScoreBreakdown,
  getKnockoutMatchScoreBreakdown,
  scoreGroupMatchPrediction,
  scoreKnockoutMatchPrediction,
} from "@/domain/scoring";
import {
  areGroupStandingsComplete,
  getGroupWinnerTeamIds,
  getQualifiedTeamIds,
  getTournamentPodium,
} from "@/domain/tournament";
import { formatArgentinaDateTime } from "@/lib/date";
import { getActiveUsers, type AppUser } from "./users";

export type RankingRow = {
  position: number;
  username: string;
  displayName: string;
  totalPoints: number;
  matchPoints: number;
  specialPoints: number;
  allInBonusPoints: number;
  exactCount: number;
  fullCount: number;
  partialCount: number;
};

export type RankingDetail = RankingRow & {
  matches: {
    id: string;
    label: string;
    kickoffLabel: string;
    predictionLabel: string;
    resultLabel: string;
    basePoints: number;
    finalPoints: number;
    scoreLabel: string;
    isAllIn: boolean;
  }[];
  specials: {
    label: string;
    predictionLabel: string;
    resultLabel: string;
    points: number;
  }[];
};

type RankingData = Awaited<ReturnType<typeof loadRankingData>>;

export async function getRanking(): Promise<RankingRow[]> {
  const users = await getActiveUsers();
  const matchRows = await withDbTimeout(db.select().from(matches), "getRanking.matches");

  if (matchRows.length === 0) {
    return rankRows(users.map(getEmptyRankingRow));
  }

  const data = await loadRankingData();
  return rankRows(data.users.map((user) => calculateUserRow(data, user)));
}

export async function getRankingDetail(username: string): Promise<RankingDetail | null> {
  const data = await loadRankingData();
  const user = data.users.find((candidate) => candidate.username === username);

  if (!user) {
    return null;
  }

  const rows = rankRows(data.users.map((candidate) => calculateUserRow(data, candidate)));
  const row = rows.find((candidate) => candidate.username === username);

  if (!row) {
    return null;
  }

  return {
    ...row,
    matches: calculateMatchDetails(data, username),
    specials: calculateSpecialDetails(data, username),
  };
}

async function loadRankingData() {
  const [users, matchRows, predictionRows, allInRows, specialRows, standingRows, teamRows, groupRows] =
    await withDbTimeout(
      Promise.all([
        getActiveUsers(),
        db.select().from(matches),
        db.select().from(matchPredictions),
        db.select().from(userAllIns),
        db.select().from(specialPredictions),
        db.select().from(standings),
        db.select().from(teams),
        db.select().from(groups),
      ]),
      "loadRankingData",
    );

  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const groupsById = new Map(groupRows.map((group) => [group.id, group]));
  const standingsComplete = areGroupStandingsComplete(standingRows);

  return {
    matchRows,
    users,
    predictionRows,
    allInRows,
    specialRows,
    standingRows,
    teamRows,
    groupRows,
    teamsById,
    groupsById,
    standingsComplete,
    predictionsByUserMatch: new Map(
      predictionRows.map((prediction) => [`${prediction.username}:${prediction.matchId}`, prediction]),
    ),
    allInByUser: new Map(allInRows.map((allIn) => [allIn.username, allIn.matchId])),
    groupWinnerByGroupId: getGroupWinnerTeamIds(standingRows),
    qualifiedTeamIds: getQualifiedTeamIds(standingRows),
    podium: getTournamentPodium(matchRows),
  };
}

function calculateUserRow(data: RankingData, user: AppUser): RankingRow {
  const username = user.username;
  const matchDetails = calculateMatchDetails(data, username);
  const specialDetails = calculateSpecialDetails(data, username);
  const matchPoints = matchDetails.reduce((total, detail) => total + detail.finalPoints, 0);
  const allInBonusPoints = matchDetails.reduce(
    (total, detail) => total + (detail.finalPoints - detail.basePoints),
    0,
  );
  const specialPoints = specialDetails.reduce((total, detail) => total + detail.points, 0);
  const exactCount = matchDetails.filter((detail) => detail.scoreLabel === "Exacto").length;
  const fullCount = matchDetails.filter((detail) =>
    ["Signo", "Ganador"].includes(detail.scoreLabel),
  ).length;
  const partialCount = matchDetails.filter((detail) => detail.scoreLabel === "Parcial").length;

  return {
    position: 0,
    username,
    displayName: user?.displayName ?? username,
    totalPoints: matchPoints + specialPoints,
    matchPoints,
    specialPoints,
    allInBonusPoints,
    exactCount,
    fullCount,
    partialCount,
  };
}

function calculateMatchDetails(data: RankingData, username: string): RankingDetail["matches"] {
  return data.matchRows
    .filter((match) => match.status === "finished")
    .map((match) => {
      const prediction = data.predictionsByUserMatch.get(`${username}:${match.id}`) ?? null;
      const homeName = match.homeTeamId ? (data.teamsById.get(match.homeTeamId)?.name ?? "TBD") : "TBD";
      const awayName = match.awayTeamId ? (data.teamsById.get(match.awayTeamId)?.name ?? "TBD") : "TBD";
      const predictionLabel = prediction
        ? `${prediction.homeGoals} - ${prediction.awayGoals}`
        : "Sin pronostico";
      const resultLabel =
        match.homeGoals === null || match.awayGoals === null
          ? "Sin resultado"
          : `${match.homeGoals} - ${match.awayGoals}`;
      const basePoints = scoreFinishedMatch(data, match, prediction);
      const scoreLabel = scoreFinishedMatchBreakdown(data, match, prediction);
      const isAllIn = data.allInByUser.get(username) === match.id;
      const finalPoints = applyAllIn(basePoints, isAllIn);

      return {
        id: match.id,
        label: `${homeName} vs ${awayName}`,
        kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
        predictionLabel,
        resultLabel,
        basePoints,
        finalPoints,
        scoreLabel,
        isAllIn,
      };
    });
}

function scoreFinishedMatch(
  _data: RankingData,
  match: RankingData["matchRows"][number],
  prediction: RankingData["predictionRows"][number] | null,
) {
  if (match.homeGoals === null || match.awayGoals === null || !match.homeTeamId || !match.awayTeamId) {
    return 0;
  }

  if (match.stage !== "group" && !match.winnerTeamId) {
    return 0;
  }

  const result = {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    winnerTeamId: match.winnerTeamId,
  };

  return match.stage === "group"
    ? scoreGroupMatchPrediction(result, prediction)
    : scoreKnockoutMatchPrediction(result, prediction);
}

function scoreFinishedMatchBreakdown(
  _data: RankingData,
  match: RankingData["matchRows"][number],
  prediction: RankingData["predictionRows"][number] | null,
) {
  if (match.homeGoals === null || match.awayGoals === null || !match.homeTeamId || !match.awayTeamId) {
    return "Pendiente";
  }

  const result = {
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    winnerTeamId: match.winnerTeamId,
  };

  return match.stage === "group"
    ? getGroupMatchScoreBreakdown(result, prediction).label
    : getKnockoutMatchScoreBreakdown(result, prediction).label;
}

function calculateSpecialDetails(data: RankingData, username: string): RankingDetail["specials"] {
  const userSpecials = data.specialRows.filter((prediction) => prediction.username === username);

  return userSpecials.map((prediction) => {
    const predictedTeam = data.teamsById.get(prediction.teamId)?.name ?? "TBD";

    if (prediction.type === "group_winner") {
      const winnerTeamId = prediction.groupId
        ? data.groupWinnerByGroupId.get(prediction.groupId)
        : null;
      const points = winnerTeamId === prediction.teamId ? 3 : 0;
      const groupCode = prediction.groupId
        ? (data.groupsById.get(prediction.groupId)?.code ?? prediction.groupId)
        : "";

      return {
        label: groupCode ? `Lider grupo ${groupCode}` : "Lider de grupo",
        predictionLabel: predictedTeam,
        resultLabel: winnerTeamId ? (data.teamsById.get(winnerTeamId)?.name ?? "TBD") : "Pendiente",
        points,
      };
    }

    if (prediction.type === "negative_surprise") {
      const classified = data.qualifiedTeamIds.has(prediction.teamId);

      return {
        label: "Sorpresa negativa",
        predictionLabel: predictedTeam,
        resultLabel: data.standingsComplete ? (classified ? "Clasifico" : "No clasifico") : "Pendiente",
        points: data.standingsComplete && !classified ? 5 : 0,
      };
    }

    const podiumTarget = getPodiumTarget(data, prediction.type);
    const pointsByType = {
      champion: 15,
      runner_up: 8,
      third_place: 5,
    } as const;

    return {
      label:
        prediction.type === "champion"
          ? "Campeon"
          : prediction.type === "runner_up"
            ? "Subcampeon"
            : "Tercer puesto",
      predictionLabel: predictedTeam,
      resultLabel: podiumTarget ? (data.teamsById.get(podiumTarget)?.name ?? "TBD") : "Pendiente",
      points: podiumTarget === prediction.teamId ? pointsByType[prediction.type] : 0,
    };
  });
}

function getPodiumTarget(data: RankingData, type: "champion" | "runner_up" | "third_place") {
  if (type === "champion") {
    return data.podium.championTeamId;
  }

  if (type === "runner_up") {
    return data.podium.runnerUpTeamId;
  }

  return data.podium.thirdPlaceTeamId;
}

function rankRows(rows: RankingRow[]): RankingRow[] {
  const sorted = [...rows].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.displayName.localeCompare(b.displayName),
  );
  let lastPoints: number | null = null;
  let lastPosition = 0;

  return sorted.map((row, index) => {
    if (row.totalPoints !== lastPoints) {
      lastPosition = index + 1;
      lastPoints = row.totalPoints;
    }

    return { ...row, position: lastPosition };
  });
}

function getEmptyRankingRow(user: AppUser): RankingRow {
  return {
    position: 0,
    username: user.username,
    displayName: user.displayName,
    totalPoints: 0,
    matchPoints: 0,
    specialPoints: 0,
    allInBonusPoints: 0,
    exactCount: 0,
    fullCount: 0,
    partialCount: 0,
  };
}
