import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { groups, matches, teams, userAllIns } from "@/db/schema";
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
    phaseLabel: string;
    kickoffLabel: string;
    deadlineLabel: string;
    isCurrent: boolean;
  }[];
};

export async function getAllInView(username: string): Promise<AllInView> {
  const now = getNow();
  const [matchRows, teamRows, groupRows, allInRows] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.kickoffAt), asc(matches.apiFootballFixtureId)),
    db.select().from(teams),
    db.select().from(groups),
    db.select().from(userAllIns).where(eq(userAllIns.username, username)),
  ]);
  const teamsById = new Map(teamRows.map((team) => [team.id, team.name]));
  const groupsById = new Map(groupRows.map((group) => [group.id, group]));
  const currentAllIn = allInRows[0] ?? null;
  const currentMatch = currentAllIn
    ? (matchRows.find((match) => match.id === currentAllIn.matchId) ?? null)
    : null;
  const currentOpen = currentMatch ? isMatchPredictionOpen(currentMatch, now) : true;

  return {
    current: currentMatch
      ? {
          matchId: currentMatch.id,
          label: getMatchLabel(currentMatch, teamsById, groupsById),
          kickoffLabel: formatArgentinaDateTime(currentMatch.kickoffAt),
          deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(currentMatch)),
          isLocked: !currentOpen,
        }
      : null,
    canMove: currentOpen,
    openMatches: matchRows
      .filter((match) => isMatchPredictionOpen(match, now))
      .sort((a, b) => getPhaseOrder(a.stage) - getPhaseOrder(b.stage) || a.kickoffAt.getTime() - b.kickoffAt.getTime())
      .map((match) => ({
        id: match.id,
        label: getMatchLabel(match, teamsById, groupsById),
        phaseLabel: getPhaseLabel(match),
        kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
        deadlineLabel: formatArgentinaDateTime(getMatchPredictionDeadline(match)),
        isCurrent: currentMatch?.id === match.id,
      })),
  };
}

function getMatchLabel(
  match: (typeof matches.$inferSelect),
  teamsById: Map<string, string>,
  groupsById: Map<string, typeof groups.$inferSelect>,
) {
  const homeName = match.homeTeamId ? (teamsById.get(match.homeTeamId) ?? "TBD") : "TBD";
  const awayName = match.awayTeamId ? (teamsById.get(match.awayTeamId) ?? "TBD") : "TBD";
  const stageLabel = match.groupId
    ? `Grupo ${groupsById.get(match.groupId)?.code ?? ""}`.trim()
    : getStageLabel(match.stage, match.roundName);
  const matchLabel = `${homeName} vs ${awayName}`;

  return stageLabel ? `${stageLabel}: ${matchLabel}` : matchLabel;
}

function getPhaseLabel(match: (typeof matches.$inferSelect)) {
  return match.stage === "group" ? "Fase de grupos" : getStageLabel(match.stage, match.roundName);
}

function getStageLabel(stage: string, roundName: string | null) {
  const labels: Record<string, string> = {
    round_of_32: "16avos",
    round_of_16: "Octavos",
    quarter_final: "Cuartos",
    semi_final: "Semifinal",
    third_place: "Tercer puesto",
    final: "Final",
  };

  return labels[stage] ?? roundName ?? stage;
}

function getPhaseOrder(stage: string) {
  const order: Record<string, number> = {
    group: 0,
    round_of_32: 1,
    round_of_16: 2,
    quarter_final: 3,
    semi_final: 4,
    third_place: 5,
    final: 6,
  };

  return order[stage] ?? 99;
}
