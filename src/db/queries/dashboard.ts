import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  groups,
  matches,
  matchPredictions,
  specialPredictions,
  teams,
  userAllIns,
} from "@/db/schema";
import {
  getKnockoutStartDeadline,
  getMatchPredictionDeadline,
  getTournamentStartDeadline,
  isMatchPredictionOpen,
} from "@/domain/deadlines";
import { getNow } from "@/lib/clock";
import { formatArgentinaDateTime, getArgentinaDateKey } from "@/lib/date";

export type DashboardSummary = {
  nextDeadline: {
    label: string;
    dateLabel: string;
  } | null;
  missingItems: {
    label: string;
    href: string;
    kind: "match" | "all-in" | "special";
    homeTeamName?: string;
    homeTeamFlagUrl?: string | null;
    awayTeamName?: string;
    awayTeamFlagUrl?: string | null;
  }[];
  todayMatches: {
    id: string;
    homeTeamName: string;
    homeTeamFlagUrl: string | null;
    awayTeamName: string;
    awayTeamFlagUrl: string | null;
    kickoffLabel: string;
    status: string;
    resultLabel: string;
  }[];
  currentAllIn: {
    matchId: string;
    label: string;
    isLocked: boolean;
  } | null;
};

export async function getDashboardSummary(username: string): Promise<DashboardSummary> {
  const now = getNow();
  const [matchRows, predictionRows, groupRows, specialRows, allInRows, teamRows] = await Promise.all([
    db.select().from(matches),
    db.select().from(matchPredictions).where(eq(matchPredictions.username, username)),
    db.select().from(groups),
    db.select().from(specialPredictions).where(eq(specialPredictions.username, username)),
    db.select().from(userAllIns).where(eq(userAllIns.username, username)),
    db.select().from(teams),
  ]);

  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const candidates: { label: string; deadline: Date; missingItems: DashboardSummary["missingItems"] }[] = [];
  const predictionsByMatchId = new Set(predictionRows.map((prediction) => prediction.matchId));
  const specialKeys = new Set(
    specialRows.map((prediction) => `${prediction.type}:${prediction.scopeKey}`),
  );
  const openMatches = matchRows.filter((match) => isMatchPredictionOpen(match, now));
  const nextMatchDeadline = openMatches
    .map((match) => getMatchPredictionDeadline(match))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (nextMatchDeadline) {
    const matchesClosing = openMatches.filter(
      (match) => getMatchPredictionDeadline(match).getTime() === nextMatchDeadline.getTime(),
    );
    const missingItems: DashboardSummary["missingItems"] = matchesClosing
      .filter((match) => !predictionsByMatchId.has(match.id))
      .slice(0, 6)
      .map((match) => ({
        label: "Pronosticar",
        href: `/fixture/${match.id}`,
        kind: "match",
        homeTeamName: getTeamName(match.homeTeamId, teamsById),
        homeTeamFlagUrl: getTeamFlagUrl(match.homeTeamId, teamsById),
        awayTeamName: getTeamName(match.awayTeamId, teamsById),
        awayTeamFlagUrl: getTeamFlagUrl(match.awayTeamId, teamsById),
      }));

    if (allInRows.length === 0) {
      missingItems.push({
        label: "Elegir All-In",
        href: "/fixture?filter=open",
        kind: "all-in",
      });
    }

    candidates.push({
      label: "Partidos",
      deadline: nextMatchDeadline,
      missingItems,
    });
  }

  const tournamentDeadline = getTournamentStartDeadline(matchRows);

  if (tournamentDeadline && now.getTime() < tournamentDeadline.getTime()) {
    const missingGroupWinners = groupRows.filter(
      (group) => !specialKeys.has(`group_winner:${group.id}`),
    ).length;
    const missingItems: DashboardSummary["missingItems"] = [];

    if (missingGroupWinners > 0) {
      missingItems.push({
        label: `Elegir ${missingGroupWinners} lideres de grupo`,
        href: "/especiales",
        kind: "special",
      });
    }

    if (!specialKeys.has("negative_surprise:global")) {
      missingItems.push({
        label: "Elegir sorpresa negativa",
        href: "/especiales",
        kind: "special",
      });
    }

    candidates.push({
      label: "Inicio del Mundial",
      deadline: tournamentDeadline,
      missingItems,
    });
  }

  const knockoutDeadline = getKnockoutStartDeadline(matchRows.filter((match) => match.stage !== "group"));

  if (knockoutDeadline && now.getTime() < knockoutDeadline.getTime()) {
    const missingItems: DashboardSummary["missingItems"] = [];

    if (!specialKeys.has("champion:global")) {
      missingItems.push({ label: "Elegir campeon", href: "/especiales", kind: "special" });
    }

    if (!specialKeys.has("runner_up:global")) {
      missingItems.push({ label: "Elegir subcampeon", href: "/especiales", kind: "special" });
    }

    if (!specialKeys.has("third_place:global")) {
      missingItems.push({ label: "Elegir tercer puesto", href: "/especiales", kind: "special" });
    }

    candidates.push({
      label: "Inicio de eliminatorias",
      deadline: knockoutDeadline,
      missingItems,
    });
  }

  const next = candidates.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0];
  const currentAllIn = allInRows[0] ?? null;
  const currentAllInMatch = currentAllIn
    ? (matchRows.find((match) => match.id === currentAllIn.matchId) ?? null)
    : null;

  return {
    nextDeadline: next
      ? {
          label: next.label,
          dateLabel: formatArgentinaDateTime(next.deadline),
        }
      : null,
    missingItems: next?.missingItems ?? [],
    todayMatches: matchRows
      .filter((match) => getArgentinaDateKey(match.kickoffAt) === getArgentinaDateKey(now))
      .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime())
      .map((match) => ({
        id: match.id,
        homeTeamName: getTeamName(match.homeTeamId, teamsById),
        homeTeamFlagUrl: getTeamFlagUrl(match.homeTeamId, teamsById),
        awayTeamName: getTeamName(match.awayTeamId, teamsById),
        awayTeamFlagUrl: getTeamFlagUrl(match.awayTeamId, teamsById),
        kickoffLabel: formatArgentinaDateTime(match.kickoffAt),
        status: match.status,
        resultLabel:
          match.homeGoals === null || match.awayGoals === null
            ? "-"
            : `${match.homeGoals} - ${match.awayGoals}`,
      })),
    currentAllIn: currentAllInMatch
      ? {
          matchId: currentAllInMatch.id,
          label: getMatchLabel(currentAllInMatch, teamsById),
          isLocked: !isMatchPredictionOpen(currentAllInMatch, now),
        }
      : null,
  };
}

function getMatchLabel(match: (typeof matches.$inferSelect), teamsById: Map<string, typeof teams.$inferSelect>) {
  const homeName = getTeamName(match.homeTeamId, teamsById);
  const awayName = getTeamName(match.awayTeamId, teamsById);
  return `${homeName} vs ${awayName}`;
}

function getTeamName(teamId: string | null, teamsById: Map<string, typeof teams.$inferSelect>) {
  return teamId ? (teamsById.get(teamId)?.name ?? "TBD") : "TBD";
}

function getTeamFlagUrl(teamId: string | null, teamsById: Map<string, typeof teams.$inferSelect>) {
  return teamId ? (teamsById.get(teamId)?.flagUrl ?? null) : null;
}
