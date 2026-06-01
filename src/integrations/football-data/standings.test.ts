import { describe, expect, it } from "vitest";
import { calculateLocalStandings } from "./standings";

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
