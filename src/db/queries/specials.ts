import { asc, eq } from "drizzle-orm";
import { NEGATIVE_SURPRISE_TEAM_NAMES } from "@/config/game";
import { db } from "@/db/client";
import { groupTeams, groups, matches, specialPredictions, standings, teams } from "@/db/schema";
import { getTournamentStartDeadline, getKnockoutStartDeadline } from "@/domain/deadlines";
import {
  areGroupStandingsComplete,
  getGroupWinnerTeamIds,
  getQualifiedTeamIds,
  getTournamentPodium,
} from "@/domain/tournament";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime } from "@/lib/date";

export type SpecialsView = {
  worldCupDeadlineLabel: string | null;
  knockoutDeadlineLabel: string | null;
  worldCupSpecialsOpen: boolean;
  knockoutSpecialsOpen: boolean;
  groups: {
    id: string;
    code: string;
    teams: TeamOption[];
    selectedTeamId: string | null;
    selectedTeamName: string | null;
    selectedTeamFlagUrl: string | null;
    resultTeamName: string | null;
    resultTeamFlagUrl: string | null;
    points: number | null;
  }[];
  negativeSurprise: {
    options: TeamOption[];
    selectedTeamId: string | null;
    selectedTeamName: string | null;
    selectedTeamFlagUrl: string | null;
    resultLabel: string;
    points: number | null;
  };
  podio: {
    teams: TeamOption[];
    champion: PodiumPredictionView;
    runnerUp: PodiumPredictionView;
    thirdPlace: PodiumPredictionView;
  };
};

type PodiumPredictionView = {
  selectedTeamId: string | null;
  selectedTeamName: string | null;
  selectedTeamFlagUrl: string | null;
  resultTeamName: string | null;
  resultTeamFlagUrl: string | null;
  points: number | null;
};

type TeamOption = { id: string; name: string; flagUrl: string | null };

export async function getSpecialsView(username: string): Promise<SpecialsView> {
  const now = getNow();
  const [matchRows, groupRows, groupTeamRows, teamRows, predictionRows, standingRows] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.kickoffAt)),
    db.select().from(groups).orderBy(asc(groups.code)),
    db.select().from(groupTeams),
    db.select().from(teams).orderBy(asc(teams.name)),
    db.select().from(specialPredictions).where(eq(specialPredictions.username, username)),
    db.select().from(standings),
  ]);

  const tournamentDeadline = getTournamentStartDeadline(matchRows);
  const knockoutDeadline = getKnockoutStartDeadline(matchRows.filter((match) => match.stage !== "group"));
  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const predictionsByTypeScope = new Map(
    predictionRows.map((prediction) => [`${prediction.type}:${prediction.scopeKey}`, prediction]),
  );
  const groupWinnerByGroupId = getGroupWinnerTeamIds(standingRows);
  const qualifiedTeamIds = getQualifiedTeamIds(standingRows);
  const podium = getTournamentPodium(matchRows);
  const standingsComplete = areGroupStandingsComplete(standingRows);

  return {
    worldCupDeadlineLabel: tournamentDeadline ? formatArgentinaDateTime(tournamentDeadline) : null,
    knockoutDeadlineLabel: knockoutDeadline ? formatArgentinaDateTime(knockoutDeadline) : null,
    worldCupSpecialsOpen: tournamentDeadline ? now.getTime() < tournamentDeadline.getTime() : false,
    knockoutSpecialsOpen: knockoutDeadline ? now.getTime() < knockoutDeadline.getTime() : false,
    groups: groupRows.map((group) => {
      const selectedTeamId = predictionsByTypeScope.get(`group_winner:${group.id}`)?.teamId ?? null;
      const resultTeamId = groupWinnerByGroupId.get(group.id) ?? null;

      return {
        id: group.id,
        code: group.code,
        teams: groupTeamRows
          .filter((entry) => entry.groupId === group.id)
          .map((entry) => teamsById.get(entry.teamId))
          .filter((team): team is NonNullable<typeof team> => Boolean(team))
          .map(toTeamOption),
        selectedTeamId,
        selectedTeamName: selectedTeamId ? (teamsById.get(selectedTeamId)?.name ?? null) : null,
        selectedTeamFlagUrl: selectedTeamId ? (teamsById.get(selectedTeamId)?.flagUrl ?? null) : null,
        resultTeamName: resultTeamId ? (teamsById.get(resultTeamId)?.name ?? null) : null,
        resultTeamFlagUrl: resultTeamId ? (teamsById.get(resultTeamId)?.flagUrl ?? null) : null,
        points: resultTeamId && selectedTeamId ? (resultTeamId === selectedTeamId ? 3 : 0) : null,
      };
    }),
    negativeSurprise: {
      options: teamRows
        .filter((team) =>
          NEGATIVE_SURPRISE_TEAM_NAMES.some((name) => normalizeName(name) === normalizeName(team.name)),
        )
        .map(toTeamOption),
      selectedTeamId:
        predictionsByTypeScope.get("negative_surprise:global")?.teamId ?? null,
      selectedTeamName: getSelectedTeamName(
        predictionsByTypeScope.get("negative_surprise:global")?.teamId ?? null,
        teamsById,
      ),
      selectedTeamFlagUrl: getSelectedTeamFlagUrl(
        predictionsByTypeScope.get("negative_surprise:global")?.teamId ?? null,
        teamsById,
      ),
      resultLabel: getNegativeSurpriseResultLabel(
        predictionsByTypeScope.get("negative_surprise:global")?.teamId ?? null,
        qualifiedTeamIds,
        standingsComplete,
      ),
      points: getNegativeSurprisePoints(
        predictionsByTypeScope.get("negative_surprise:global")?.teamId ?? null,
        qualifiedTeamIds,
        standingsComplete,
      ),
    },
    podio: {
      teams: teamRows.map(toTeamOption),
      champion: getPodiumPredictionView(
        predictionsByTypeScope.get("champion:global")?.teamId ?? null,
        podium.championTeamId,
        15,
        teamsById,
      ),
      runnerUp: getPodiumPredictionView(
        predictionsByTypeScope.get("runner_up:global")?.teamId ?? null,
        podium.runnerUpTeamId,
        8,
        teamsById,
      ),
      thirdPlace: getPodiumPredictionView(
        predictionsByTypeScope.get("third_place:global")?.teamId ?? null,
        podium.thirdPlaceTeamId,
        5,
        teamsById,
      ),
    },
  };
}

function normalizeName(name: string): string {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function getSelectedTeamName(teamId: string | null, teamsById: Map<string, typeof teams.$inferSelect>) {
  return teamId ? (teamsById.get(teamId)?.name ?? null) : null;
}

function getSelectedTeamFlagUrl(teamId: string | null, teamsById: Map<string, typeof teams.$inferSelect>) {
  return teamId ? (teamsById.get(teamId)?.flagUrl ?? null) : null;
}

function toTeamOption(team: typeof teams.$inferSelect): TeamOption {
  return { id: team.id, name: team.name, flagUrl: team.flagUrl };
}

function getNegativeSurpriseResultLabel(
  teamId: string | null,
  qualifiedTeamIds: Set<string>,
  standingsComplete: boolean,
) {
  if (!teamId || !standingsComplete) {
    return "Pendiente";
  }

  return qualifiedTeamIds.has(teamId) ? "Clasifico" : "No clasifico";
}

function getNegativeSurprisePoints(
  teamId: string | null,
  qualifiedTeamIds: Set<string>,
  standingsComplete: boolean,
) {
  if (!teamId || !standingsComplete) {
    return null;
  }

  return qualifiedTeamIds.has(teamId) ? 0 : 5;
}


function getPodiumPredictionView(
  selectedTeamId: string | null,
  resultTeamId: string | null,
  pointsValue: number,
  teamsById: Map<string, typeof teams.$inferSelect>,
): PodiumPredictionView {
  return {
    selectedTeamId,
    selectedTeamName: getSelectedTeamName(selectedTeamId, teamsById),
    selectedTeamFlagUrl: getSelectedTeamFlagUrl(selectedTeamId, teamsById),
    resultTeamName: resultTeamId ? (teamsById.get(resultTeamId)?.name ?? null) : null,
    resultTeamFlagUrl: resultTeamId ? (teamsById.get(resultTeamId)?.flagUrl ?? null) : null,
    points: selectedTeamId && resultTeamId ? (selectedTeamId === resultTeamId ? pointsValue : 0) : null,
  };
}
