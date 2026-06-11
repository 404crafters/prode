import { describe, expect, it } from "vitest";
import type { FootballDataStandingsResponse } from "./client";
import { calculateLocalStandings, extractApiTotalStandings } from "./standings";

describe("football-data local standings", () => {
  it("calculates a group table from finished matches", () => {
    const standings = calculateLocalStandings(
      [
        { groupCode: "A", teamId: "mex", teamName: "Mexico", seed: 1 },
        { groupCode: "A", teamId: "rsa", teamName: "South Africa", seed: 2 },
        { groupCode: "A", teamId: "kor", teamName: "Korea Republic", seed: 3 },
        { groupCode: "A", teamId: "cze", teamName: "Czechia", seed: 4 },
      ],
      [
        {
          groupCode: "A",
          status: "finished",
          homeTeamId: "mex",
          awayTeamId: "rsa",
          homeGoals: 2,
          awayGoals: 0,
        },
        {
          groupCode: "A",
          status: "finished",
          homeTeamId: "kor",
          awayTeamId: "cze",
          homeGoals: 1,
          awayGoals: 1,
        },
        {
          groupCode: "A",
          status: "scheduled",
          homeTeamId: "mex",
          awayTeamId: "kor",
          homeGoals: null,
          awayGoals: null,
        },
      ],
    );

    expect(standings).toEqual([
      {
        groupCode: "A",
        teamId: "mex",
        rank: 1,
        points: 3,
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
      },
      {
        groupCode: "A",
        teamId: "kor",
        rank: 2,
        points: 1,
        played: 1,
        won: 0,
        drawn: 1,
        lost: 0,
        goalsFor: 1,
        goalsAgainst: 1,
        goalDifference: 0,
      },
      {
        groupCode: "A",
        teamId: "cze",
        rank: 3,
        points: 1,
        played: 1,
        won: 0,
        drawn: 1,
        lost: 0,
        goalsFor: 1,
        goalsAgainst: 1,
        goalDifference: 0,
      },
      {
        groupCode: "A",
        teamId: "rsa",
        rank: 4,
        points: 0,
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 0,
        goalsAgainst: 2,
        goalDifference: -2,
      },
    ]);
  });
});

describe("football-data API total standings", () => {
  it("maps the flat 2026 TOTAL table (group: null) back into per-group tables", () => {
    const apiStandings: FootballDataStandingsResponse = {
      competition: { id: 2000, name: "FIFA World Cup", code: "WC" },
      season: { id: 1, startDate: "2026-06-11", endDate: "2026-07-19" },
      standings: [
        {
          stage: "GROUP_STAGE",
          type: "TOTAL",
          group: null,
          table: [
            makeRow({ id: 769, name: "Mexico", position: 1, playedGames: 1, won: 1, points: 3, goalsFor: 2, goalsAgainst: 0, goalDifference: 2 }),
            makeRow({ id: 805, name: "Spain", position: 2, playedGames: 0, points: 0 }),
            makeRow({ id: 770, name: "South Africa", position: 48, playedGames: 1, lost: 1, points: 0, goalsFor: 0, goalsAgainst: 2, goalDifference: -2 }),
            makeRow({ id: 806, name: "Croatia", position: 30, playedGames: 0, points: 0 }),
          ],
        },
        // HOME / AWAY tables are present in the real feed and must be ignored.
        { stage: "GROUP_STAGE", type: "HOME", group: null, table: [] },
        { stage: "GROUP_STAGE", type: "AWAY", group: null, table: [] },
      ],
    };

    const teamIdByExternalId = new Map<number, string>([
      [769, "mex"],
      [770, "rsa"],
      [805, "esp"],
      [806, "cro"],
    ]);
    const groupByExternalTeamId = new Map([
      [769, { groupCode: "A", seed: 1 }],
      [770, { groupCode: "A", seed: 2 }],
      [805, { groupCode: "B", seed: 1 }],
      [806, { groupCode: "B", seed: 2 }],
    ]);

    const rows = extractApiTotalStandings(apiStandings, teamIdByExternalId, groupByExternalTeamId);

    expect(rows).toEqual([
      {
        groupCode: "A",
        teamId: "mex",
        rank: 1,
        points: 3,
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
      },
      {
        groupCode: "A",
        teamId: "rsa",
        rank: 2,
        points: 0,
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 0,
        goalsAgainst: 2,
        goalDifference: -2,
      },
      {
        groupCode: "B",
        teamId: "esp",
        rank: 1,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
      {
        groupCode: "B",
        teamId: "cro",
        rank: 2,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
    ]);
  });
});

function makeRow(
  overrides: {
    id: number;
    name: string;
    position: number;
    playedGames: number;
    won?: number;
    draw?: number;
    lost?: number;
    points: number;
    goalsFor?: number;
    goalsAgainst?: number;
    goalDifference?: number;
  },
): FootballDataStandingsResponse["standings"][number]["table"][number] {
  return {
    position: overrides.position,
    team: { id: overrides.id, name: overrides.name, shortName: overrides.name, tla: null, crest: null },
    playedGames: overrides.playedGames,
    form: null,
    won: overrides.won ?? 0,
    draw: overrides.draw ?? 0,
    lost: overrides.lost ?? 0,
    points: overrides.points,
    goalsFor: overrides.goalsFor ?? 0,
    goalsAgainst: overrides.goalsAgainst ?? 0,
    goalDifference: overrides.goalDifference ?? 0,
  };
}
