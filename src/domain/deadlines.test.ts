import { describe, expect, it } from "vitest";
import {
  areMatchPredictionsVisible,
  getMatchPredictionDeadline,
  isMatchPredictionOpen,
} from "./deadlines";

describe("match deadlines", () => {
  const match = {
    kickoffAt: new Date("2026-06-15T18:00:00-03:00"),
  };

  it("closes at the start of the match day in Argentina", () => {
    expect(getMatchPredictionDeadline(match).toISOString()).toBe("2026-06-15T03:00:00.000Z");
  });

  it("is open before the match day starts in Argentina", () => {
    expect(isMatchPredictionOpen(match, new Date("2026-06-14T23:59:59-03:00"))).toBe(true);
  });

  it("is closed once the match day starts in Argentina", () => {
    expect(isMatchPredictionOpen(match, new Date("2026-06-15T00:00:00-03:00"))).toBe(false);
  });

  it("shows all predictions when closed", () => {
    expect(areMatchPredictionsVisible(match, new Date("2026-06-15T00:00:00-03:00"))).toBe(true);
  });
});
