import type { MatchStage, MatchStatus } from "@/db/schema";
import type { FootballDataMatch } from "./client";

const TEAM_NAME_OVERRIDES: Record<string, string> = {
  Brazil: "Brasil",
  England: "Inglaterra",
  Germany: "Alemania",
  Netherlands: "Holanda",
  Spain: "España",
};

export function mapTeamDisplayName(name: string): string {
  return TEAM_NAME_OVERRIDES[name] ?? name;
}

export function mapFootballDataStage(stage: string | null): MatchStage {
  switch (stage) {
    case "GROUP_STAGE":
      return "group";
    case "LAST_32":
      return "round_of_32";
    case "LAST_16":
      return "round_of_16";
    case "QUARTER_FINALS":
      return "quarter_final";
    case "SEMI_FINALS":
      return "semi_final";
    case "THIRD_PLACE":
      return "third_place";
    case "FINAL":
      return "final";
    default:
      return "unknown";
  }
}

export function mapFootballDataStatus(status: string | null): MatchStatus {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "scheduled";
    case "LIVE":
    case "IN_PLAY":
    case "PAUSED":
      return "in_progress";
    case "FINISHED":
      return "finished";
    case "POSTPONED":
    case "SUSPENDED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "unknown";
  }
}

export function mapFootballDataGroupCode(group: string | null): string | null {
  const match = group?.match(/^GROUP_([A-Z])$/);
  return match?.[1] ?? null;
}

export function getWinnerExternalTeamId(match: FootballDataMatch): number | null {
  if (match.score.winner === "HOME_TEAM") {
    return match.homeTeam.id;
  }

  if (match.score.winner === "AWAY_TEAM") {
    return match.awayTeam.id;
  }

  return null;
}

export function getGoalsWithoutPenaltyShootout(match: FootballDataMatch) {
  if (match.score.duration !== "PENALTY_SHOOTOUT") {
    return match.score.fullTime;
  }

  const regularTime = match.score.regularTime;
  const extraTime = match.score.extraTime;

  if (
    regularTime?.home !== null &&
    regularTime?.home !== undefined &&
    regularTime.away !== null &&
    regularTime.away !== undefined
  ) {
    return {
      home: regularTime.home + (extraTime?.home ?? 0),
      away: regularTime.away + (extraTime?.away ?? 0),
    };
  }

  const penalties = match.score.penalties;

  if (
    penalties?.home !== null &&
    penalties?.home !== undefined &&
    penalties.away !== null &&
    penalties.away !== undefined &&
    match.score.fullTime.home !== null &&
    match.score.fullTime.away !== null
  ) {
    return {
      home: match.score.fullTime.home - penalties.home,
      away: match.score.fullTime.away - penalties.away,
    };
  }

  return match.score.fullTime;
}
