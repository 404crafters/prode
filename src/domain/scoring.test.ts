import { describe, expect, it } from "vitest";
import {
  applyAllIn,
  scoreGroupMatchPrediction,
  scoreKnockoutMatchPrediction,
  type MatchResult,
} from "./scoring";

const groupResult: MatchResult = {
  homeTeamId: "arg",
  awayTeamId: "fra",
  homeGoals: 2,
  awayGoals: 1,
  winnerTeamId: "arg",
};

describe("scoreGroupMatchPrediction", () => {
  it("scores exact result with 5 points", () => {
    expect(
      scoreGroupMatchPrediction(groupResult, {
        homeGoals: 2,
        awayGoals: 1,
        predictedWinnerTeamId: null,
      }),
    ).toBe(5);
  });

  it("scores exact sign with 3 points", () => {
    expect(
      scoreGroupMatchPrediction(groupResult, {
        homeGoals: 1,
        awayGoals: 0,
        predictedWinnerTeamId: null,
      }),
    ).toBe(3);
  });

  it("scores draw prediction against winner result with 1 point", () => {
    expect(
      scoreGroupMatchPrediction(groupResult, {
        homeGoals: 1,
        awayGoals: 1,
        predictedWinnerTeamId: null,
      }),
    ).toBe(1);
  });

  it("scores winner prediction against draw result with 1 point", () => {
    expect(
      scoreGroupMatchPrediction(
        { ...groupResult, homeGoals: 1, awayGoals: 1, winnerTeamId: null },
        {
          homeGoals: 2,
          awayGoals: 1,
          predictedWinnerTeamId: null,
        },
      ),
    ).toBe(1);
  });

  it("scores opposite winner with 0 points", () => {
    expect(
      scoreGroupMatchPrediction(groupResult, {
        homeGoals: 0,
        awayGoals: 1,
        predictedWinnerTeamId: null,
      }),
    ).toBe(0);
  });
});

describe("scoreKnockoutMatchPrediction", () => {
  const penaltiesResult: MatchResult = {
    homeTeamId: "arg",
    awayTeamId: "fra",
    homeGoals: 1,
    awayGoals: 1,
    winnerTeamId: "arg",
  };

  it("scores exact goals and final winner with 5 points", () => {
    expect(
      scoreKnockoutMatchPrediction(penaltiesResult, {
        homeGoals: 1,
        awayGoals: 1,
        predictedWinnerTeamId: "arg",
      }),
    ).toBe(5);
  });

  it("scores final winner with 3 points", () => {
    expect(
      scoreKnockoutMatchPrediction(penaltiesResult, {
        homeGoals: 2,
        awayGoals: 1,
        predictedWinnerTeamId: null,
      }),
    ).toBe(3);
  });

  it("scores exact goals and wrong final winner with 1 point", () => {
    expect(
      scoreKnockoutMatchPrediction(penaltiesResult, {
        homeGoals: 1,
        awayGoals: 1,
        predictedWinnerTeamId: "fra",
      }),
    ).toBe(1);
  });

  it("scores wrong winner and wrong goals with 0 points", () => {
    expect(
      scoreKnockoutMatchPrediction(penaltiesResult, {
        homeGoals: 0,
        awayGoals: 1,
        predictedWinnerTeamId: null,
      }),
    ).toBe(0);
  });
});

describe("applyAllIn", () => {
  it("triples base points when all-in applies", () => {
    expect(applyAllIn(5, true)).toBe(15);
  });

  it("keeps base points when all-in does not apply", () => {
    expect(applyAllIn(3, false)).toBe(3);
  });
});
