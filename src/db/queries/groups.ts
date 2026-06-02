import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { withDbTimeout } from "@/db/with-timeout";
import { groupTeams, groups, standings, teams } from "@/db/schema";

export type GroupView = {
  id: string;
  code: string;
  name: string;
  teams: {
    id: string;
    name: string;
    flagUrl: string | null;
    seed: number | null;
    standing: {
      rank: number;
      points: number | null;
      played: number | null;
      won: number | null;
      drawn: number | null;
      lost: number | null;
      goalsFor: number | null;
      goalsAgainst: number | null;
      goalDifference: number | null;
    } | null;
  }[];
};

export async function getGroupsView(): Promise<GroupView[]> {
  const [groupRows, groupTeamRows, teamRows, standingRows] = await withDbTimeout(
    Promise.all([
      db.select().from(groups).orderBy(asc(groups.code)),
      db.select().from(groupTeams),
      db.select().from(teams),
      db.select().from(standings),
    ]),
    "getGroupsView",
  );

  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const standingsByGroupTeam = new Map(
    standingRows.map((standing) => [`${standing.groupId}:${standing.teamId}`, standing]),
  );

  return groupRows.map((group) => {
    const entries = groupTeamRows
      .filter((entry) => entry.groupId === group.id)
      .map((entry) => {
        const team = teamsById.get(entry.teamId);
        const standing = standingsByGroupTeam.get(`${entry.groupId}:${entry.teamId}`);

        return team
          ? {
              id: team.id,
              name: team.name,
              flagUrl: team.flagUrl,
              seed: entry.positionSeed,
              standing: standing
                ? {
                    rank: standing.rank,
                    points: standing.points,
                    played: standing.played,
                    won: standing.won,
                    drawn: standing.drawn,
                    lost: standing.lost,
                    goalsFor: standing.goalsFor,
                    goalsAgainst: standing.goalsAgainst,
                    goalDifference: standing.goalDifference,
                  }
                : null,
            }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => {
        const rankA = a.standing?.rank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.standing?.rank ?? Number.MAX_SAFE_INTEGER;

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        return (a.seed ?? 0) - (b.seed ?? 0);
      });

    return {
      id: group.id,
      code: group.code,
      name: group.name,
      teams: entries,
    };
  });
}
