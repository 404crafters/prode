import { describe, expect, it } from "vitest";
import { areGroupStandingsComplete, getQualifiedTeamIds, getTournamentPodium } from "./tournament";

describe("getQualifiedTeamIds", () => {
  it("includes group top two and eight best third-placed teams", () => {
    const standings = Array.from({ length: 12 }, (_, groupIndex) =>
      [1, 2, 3, 4].map((rank) => ({
        groupId: `group-${groupIndex}`,
        teamId: `team-${groupIndex}-${rank}`,
        rank,
        points: rank === 3 ? 12 - groupIndex : 10 - rank,
        goalDifference: 0,
        goalsFor: 0,
      })),
    ).flat();

    const qualified = getQualifiedTeamIds(standings);

    expect(qualified.has("team-0-1")).toBe(true);
    expect(qualified.has("team-0-2")).toBe(true);
    expect(qualified.has("team-0-3")).toBe(true);
    expect(qualified.has("team-7-3")).toBe(true);
    expect(qualified.has("team-8-3")).toBe(false);
    expect(qualified.has("team-0-4")).toBe(false);
    expect(qualified.size).toBe(32);
  });
});

describe("areGroupStandingsComplete", () => {
  it("requires all twelve groups with four teams and three played matches", () => {
    const completeStandings = Array.from({ length: 12 }, (_, groupIndex) =>
      [1, 2, 3, 4].map((rank) => ({
        groupId: `group-${groupIndex}`,
        teamId: `team-${groupIndex}-${rank}`,
        rank,
        points: 10 - rank,
        played: 3,
        goalDifference: 0,
        goalsFor: 0,
      })),
    ).flat();

    expect(areGroupStandingsComplete(completeStandings)).toBe(true);
    expect(areGroupStandingsComplete(completeStandings.slice(0, -1))).toBe(false);
    expect(
      areGroupStandingsComplete([
        { ...completeStandings[0], played: 2 },
        ...completeStandings.slice(1),
      ]),
    ).toBe(false);
  });
});

describe("getTournamentPodium", () => {
  it("derives champion, runner-up and third place from final matches", () => {
    expect(
      getTournamentPodium([
        {
          stage: "final",
          status: "finished",
          homeTeamId: "arg",
          awayTeamId: "fra",
          winnerTeamId: "arg",
        },
        {
          stage: "third_place",
          status: "finished",
          homeTeamId: "bra",
          awayTeamId: "ale",
          winnerTeamId: "bra",
        },
      ]),
    ).toEqual({
      championTeamId: "arg",
      runnerUpTeamId: "fra",
      thirdPlaceTeamId: "bra",
    });
  });
});
