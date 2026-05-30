import type { MatchStatus, MatchStage } from "@/db/schema";
import type { ApiFootballFixtureResponse } from "./client";

export function mapFixtureStatus(shortStatus: string | null): MatchStatus {
  if (!shortStatus) {
    return "unknown";
  }

  if (["TBD", "NS"].includes(shortStatus)) {
    return "scheduled";
  }

  if (["1H", "HT", "2H", "ET", "P", "BT", "LIVE"].includes(shortStatus)) {
    return "in_progress";
  }

  if (["FT", "AET", "PEN"].includes(shortStatus)) {
    return "finished";
  }

  if (["PST", "SUSP", "INT"].includes(shortStatus)) {
    return "postponed";
  }

  if (["CANC", "ABD", "AWD", "WO"].includes(shortStatus)) {
    return "cancelled";
  }

  return "unknown";
}

export function mapRoundToStage(round: string | null): MatchStage {
  const normalized = (round ?? "").toLowerCase();

  if (normalized.includes("group")) {
    return "group";
  }

  if (normalized.includes("round of 32") || normalized.includes("32")) {
    return "round_of_32";
  }

  if (normalized.includes("round of 16") || normalized.includes("16")) {
    return "round_of_16";
  }

  if (normalized.includes("quarter")) {
    return "quarter_final";
  }

  if (normalized.includes("semi")) {
    return "semi_final";
  }

  if (normalized.includes("third")) {
    return "third_place";
  }

  if (normalized.includes("final")) {
    return "final";
  }

  return "unknown";
}

export function getFixtureWinnerApiTeamId(fixture: ApiFootballFixtureResponse): number | null {
  if (fixture.teams.home.winner === true) {
    return fixture.teams.home.id;
  }

  if (fixture.teams.away.winner === true) {
    return fixture.teams.away.id;
  }

  return null;
}
