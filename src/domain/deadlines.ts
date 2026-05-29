import { getStartOfArgentinaDayFor } from "@/lib/date";

export type DeadlineMatch = {
  kickoffAt: Date;
};

export function getMatchPredictionDeadline(match: DeadlineMatch): Date {
  return getStartOfArgentinaDayFor(match.kickoffAt);
}

export function isMatchPredictionOpen(match: DeadlineMatch, now: Date): boolean {
  return now.getTime() < getMatchPredictionDeadline(match).getTime();
}

export function areMatchPredictionsVisible(match: DeadlineMatch, now: Date): boolean {
  return !isMatchPredictionOpen(match, now);
}

export function getTournamentStartDeadline(matches: DeadlineMatch[]): Date | null {
  const firstKickoff = matches
    .map((match) => match.kickoffAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return firstKickoff ? getStartOfArgentinaDayFor(firstKickoff) : null;
}

export function getKnockoutStartDeadline(matches: DeadlineMatch[]): Date | null {
  return getTournamentStartDeadline(matches);
}
