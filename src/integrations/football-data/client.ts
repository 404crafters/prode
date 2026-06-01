import { getEnv } from "@/lib/env";

type FootballDataResultSet = {
  count: number;
  first?: string;
  last?: string;
  played?: number;
};

export type FootballDataCompetitionResponse = {
  id: number;
  name: string;
  code: string;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number | null;
  };
};

export type FootballDataTeam = {
  id: number;
  name: string;
  shortName: string;
  tla: string | null;
  crest: string | null;
};

export type FootballDataTeamsResponse = {
  count: number;
  competition: {
    id: number;
    name: string;
    code: string;
  };
  season: {
    id: number;
    startDate: string;
    endDate: string;
  };
  teams: FootballDataTeam[];
};

export type FootballDataMatchTeam = {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
};

export type FootballDataScoreSide = {
  home: number | null;
  away: number | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: FootballDataMatchTeam;
  awayTeam: FootballDataMatchTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | string;
    fullTime: FootballDataScoreSide;
    regularTime?: FootballDataScoreSide;
    extraTime?: FootballDataScoreSide;
    penalties?: FootballDataScoreSide;
  };
};

export type FootballDataMatchesResponse = {
  resultSet: FootballDataResultSet;
  competition: {
    id: number;
    name: string;
    code: string;
  };
  matches: FootballDataMatch[];
};

export type FootballDataStandingRow = {
  position: number;
  team: FootballDataTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export type FootballDataStandingsResponse = {
  competition: {
    id: number;
    name: string;
    code: string;
  };
  season: {
    id: number;
    startDate: string;
    endDate: string;
  };
  standings: {
    stage: string;
    type: "TOTAL" | "HOME" | "AWAY" | string;
    group: string | null;
    table: FootballDataStandingRow[];
  }[];
};

type RequestOptions = {
  params?: Record<string, string | number | undefined>;
  retries?: number;
};

export class FootballDataClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly competition: string;
  private readonly season: number;

  constructor() {
    const env = getEnv();

    if (!env.FOOTBALL_DATA_API_TOKEN) {
      throw new Error("FOOTBALL_DATA_API_TOKEN is required to sync football-data.org.");
    }

    this.baseUrl = env.FOOTBALL_DATA_BASE_URL;
    this.token = env.FOOTBALL_DATA_API_TOKEN;
    this.competition = env.FOOTBALL_DATA_COMPETITION;
    this.season = env.FOOTBALL_DATA_SEASON;
  }

  getCompetition() {
    return this.request<FootballDataCompetitionResponse>(`/competitions/${this.competition}`, {
      params: { season: this.season },
    });
  }

  getTeams() {
    return this.request<FootballDataTeamsResponse>(`/competitions/${this.competition}/teams`, {
      params: { season: this.season },
    });
  }

  getMatches(dateFrom: string, dateTo: string) {
    return this.request<FootballDataMatchesResponse>(`/competitions/${this.competition}/matches`, {
      params: { season: this.season, dateFrom, dateTo },
    });
  }

  getStandings() {
    return this.request<FootballDataStandingsResponse>(`/competitions/${this.competition}/standings`, {
      params: { season: this.season },
    });
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(
      `${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    );

    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": this.token,
      },
      cache: "no-store",
    });

    if (response.status === 429 && (options.retries ?? 1) > 0) {
      await waitForReset(response.headers);
      return this.request<T>(path, { ...options, retries: (options.retries ?? 1) - 1 });
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `football-data.org request failed: ${response.status} ${response.statusText} ${url.toString()} ${body.slice(0, 300)}`,
      );
    }

    await throttleIfNeeded(response.headers);

    return (await response.json()) as T;
  }
}

async function throttleIfNeeded(headers: Headers) {
  const available = getRequestsAvailable(headers);

  if (available !== null && available <= 1) {
    await waitForReset(headers);
  }
}

function getRequestsAvailable(headers: Headers): number | null {
  const raw = headers.get("X-Requests-Available-Minute") ?? headers.get("X-RequestsAvailable");
  const value = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isFinite(value) ? value : null;
}

async function waitForReset(headers: Headers) {
  const rawReset = headers.get("X-RequestCounter-Reset") ?? headers.get("Retry-After");
  const resetSeconds = rawReset ? Number.parseInt(rawReset, 10) : 60;
  const waitMs = Math.max(1, resetSeconds) * 1000;

  await new Promise((resolve) => setTimeout(resolve, waitMs));
}
