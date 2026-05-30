export type StandingLike = {
  groupId: string;
  teamId: string;
  rank: number;
  points: number | null;
  played?: number | null;
  goalDifference: number | null;
  goalsFor: number | null;
};

export type MatchLike = {
  stage: string;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
};

export type TournamentPodium = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
};

export function getGroupWinnerTeamIds(standings: StandingLike[]): Map<string, string> {
  return new Map(
    standings
      .filter((standing) => standing.rank === 1)
      .map((standing) => [standing.groupId, standing.teamId]),
  );
}

export function getQualifiedTeamIds(standings: StandingLike[]): Set<string> {
  const qualified = new Set<string>();

  for (const standing of standings) {
    if (standing.rank <= 2) {
      qualified.add(standing.teamId);
    }
  }

  standings
    .filter((standing) => standing.rank === 3)
    .sort((a, b) => {
      const pointsDiff = (b.points ?? 0) - (a.points ?? 0);

      if (pointsDiff !== 0) {
        return pointsDiff;
      }

      const goalDiff = (b.goalDifference ?? 0) - (a.goalDifference ?? 0);

      if (goalDiff !== 0) {
        return goalDiff;
      }

      return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
    })
    .slice(0, 8)
    .forEach((standing) => qualified.add(standing.teamId));

  return qualified;
}

export function areGroupStandingsComplete(standings: StandingLike[]): boolean {
  const standingsByGroup = new Map<string, StandingLike[]>();

  for (const standing of standings) {
    const current = standingsByGroup.get(standing.groupId) ?? [];
    current.push(standing);
    standingsByGroup.set(standing.groupId, current);
  }

  return standingsByGroup.size >= 12 && [...standingsByGroup.values()].every((groupStandings) =>
    groupStandings.length >= 4 && groupStandings.every((standing) => (standing.played ?? 0) >= 3),
  );
}

export function getTournamentPodium(matches: MatchLike[]): TournamentPodium {
  const final = matches.find((match) => match.stage === "final" && match.status === "finished");
  const thirdPlace = matches.find(
    (match) => match.stage === "third_place" && match.status === "finished",
  );
  const championTeamId = final?.winnerTeamId ?? null;
  const runnerUpTeamId =
    final && final.homeTeamId && final.awayTeamId && final.winnerTeamId
      ? final.winnerTeamId === final.homeTeamId
        ? final.awayTeamId
        : final.homeTeamId
      : null;

  return {
    championTeamId,
    runnerUpTeamId,
    thirdPlaceTeamId: thirdPlace?.winnerTeamId ?? null,
  };
}
