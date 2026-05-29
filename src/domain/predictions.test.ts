import { describe, expect, it } from "vitest";
import { validateMatchPredictionInput } from "./predictions";

const knockoutMatch = {
  id: "match-1",
  stage: "round_of_32",
  homeTeamId: "arg",
  awayTeamId: "fra",
};

describe("validateMatchPredictionInput", () => {
  it("requires final winner for knockout draw prediction", () => {
    expect(
      validateMatchPredictionInput(knockoutMatch, {
        homeGoals: 1,
        awayGoals: 1,
        predictedWinnerTeamId: null,
      }),
    ).toContain("ganador");
  });

  it("accepts final winner for knockout draw prediction", () => {
    expect(
      validateMatchPredictionInput(knockoutMatch, {
        homeGoals: 1,
        awayGoals: 1,
        predictedWinnerTeamId: "arg",
      }),
    ).toBeNull();
  });

  it("does not require winner for group draw prediction", () => {
    expect(
      validateMatchPredictionInput(
        { ...knockoutMatch, stage: "group" },
        {
          homeGoals: 1,
          awayGoals: 1,
          predictedWinnerTeamId: null,
        },
      ),
    ).toBeNull();
  });
});
