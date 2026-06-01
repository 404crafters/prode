import { describe, expect, it } from "vitest";
import {
  getGoalsWithoutPenaltyShootout,
  mapFootballDataStage,
  mapFootballDataStatus,
  mapTeamDisplayName,
} from "./mapper";
import type { FootballDataMatch } from "./client";

describe("football-data mapper", () => {
  it("maps World Cup stages to local stages", () => {
    expect(mapFootballDataStage("GROUP_STAGE")).toBe("group");
    expect(mapFootballDataStage("LAST_32")).toBe("round_of_32");
    expect(mapFootballDataStage("LAST_16")).toBe("round_of_16");
    expect(mapFootballDataStage("QUARTER_FINALS")).toBe("quarter_final");
    expect(mapFootballDataStage("SEMI_FINALS")).toBe("semi_final");
    expect(mapFootballDataStage("THIRD_PLACE")).toBe("third_place");
    expect(mapFootballDataStage("FINAL")).toBe("final");
  });

  it("maps statuses to local statuses", () => {
    expect(mapFootballDataStatus("TIMED")).toBe("scheduled");
    expect(mapFootballDataStatus("IN_PLAY")).toBe("in_progress");
    expect(mapFootballDataStatus("FINISHED")).toBe("finished");
    expect(mapFootballDataStatus("POSTPONED")).toBe("postponed");
    expect(mapFootballDataStatus("CANCELLED")).toBe("cancelled");
  });

  it("stores knockout goals without penalty shootout goals", () => {
    const match = makeMatch({
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 6, away: 5 },
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 1, away: 1 },
      penalties: { home: 4, away: 3 },
    });

    expect(getGoalsWithoutPenaltyShootout(match)).toEqual({ home: 2, away: 2 });
  });

  it("falls back by subtracting penalties when regular time is not available", () => {
    const match = makeMatch({
      duration: "PENALTY_SHOOTOUT",
      fullTime: { home: 5, away: 4 },
      penalties: { home: 4, away: 3 },
    });

    expect(getGoalsWithoutPenaltyShootout(match)).toEqual({ home: 1, away: 1 });
  });

  it("normalizes known team names to Spanish display names", () => {
    expect(mapTeamDisplayName("Spain")).toBe("España");
    expect(mapTeamDisplayName("Germany")).toBe("Alemania");
    expect(mapTeamDisplayName("Netherlands")).toBe("Holanda");
  });
});

function makeMatch(score: Partial<FootballDataMatch["score"]>): FootballDataMatch {
  return {
    id: 1,
    utcDate: "2026-07-05T19:00:00Z",
    status: "FINISHED",
    stage: "LAST_32",
    group: null,
    matchday: null,
    homeTeam: {
      id: 1,
      name: "Home",
      shortName: "Home",
      tla: "HOM",
      crest: null,
    },
    awayTeam: {
      id: 2,
      name: "Away",
      shortName: "Away",
      tla: "AWA",
      crest: null,
    },
    score: {
      winner: "HOME_TEAM",
      duration: "REGULAR",
      fullTime: { home: null, away: null },
      ...score,
    },
  };
}
