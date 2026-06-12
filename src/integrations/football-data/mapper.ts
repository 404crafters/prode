import type { MatchStage, MatchStatus } from "@/db/schema";
import type { FootballDataMatch } from "./client";

// Keys are the English country names as returned by the football-data API.
// Only countries whose Spanish name differs are listed; the rest fall through
// unchanged (Argentina, Australia, Austria, Colombia, Ecuador, Ghana, Paraguay,
// Portugal, Qatar, Senegal, Uruguay, ...).
const TEAM_NAME_OVERRIDES: Record<string, string> = {
  Algeria: "Argelia",
  Belgium: "Bélgica",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  "Cape Verde Islands": "Cabo Verde",
  "Congo DR": "RD del Congo",
  Croatia: "Croacia",
  Curaçao: "Curazao",
  Czechia: "Chequia",
  Egypt: "Egipto",
  England: "Inglaterra",
  France: "Francia",
  Germany: "Alemania",
  Haiti: "Haití",
  Iran: "Irán",
  Iraq: "Irak",
  "Ivory Coast": "Costa de Marfil",
  Japan: "Japón",
  Jordan: "Jordania",
  Mexico: "México",
  Morocco: "Marruecos",
  Netherlands: "Holanda",
  "New Zealand": "Nueva Zelanda",
  Norway: "Noruega",
  Panama: "Panamá",
  "Saudi Arabia": "Arabia Saudita",
  Scotland: "Escocia",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  Spain: "España",
  Sweden: "Suecia",
  Switzerland: "Suiza",
  Tunisia: "Túnez",
  Turkey: "Turquía",
  "United States": "Estados Unidos",
  Uzbekistan: "Uzbekistán",
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

/**
 * Picks the fixtures whose results we should re-fetch by id on each sync:
 * matches that have already kicked off within the trailing window. The window
 * spans more than a day so results football-data publishes after the Argentina
 * midnight boundary are still refreshed on the next hourly run.
 */
export function selectMatchIdsToRefresh(
  matches: Pick<FootballDataMatch, "id" | "utcDate">[],
  now: Date,
  windowMs: number,
): number[] {
  const nowMs = now.getTime();
  const sinceMs = nowMs - windowMs;

  return matches
    .filter((match) => {
      const kickoffMs = new Date(match.utcDate).getTime();
      return Number.isFinite(kickoffMs) && kickoffMs <= nowMs && kickoffMs >= sinceMs;
    })
    .map((match) => match.id);
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
