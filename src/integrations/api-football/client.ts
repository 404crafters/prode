import { getEnv } from "@/lib/env";

type ApiFootballEnvelope<T> = {
  get: string;
  parameters: Record<string, string>;
  errors: unknown[] | Record<string, unknown>;
  results: number;
  response: T;
};

export type ApiFootballTeamResponse = {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    logo: string | null;
  };
};

export type ApiFootballFixtureResponse = {
  fixture: {
    id: number;
    date: string;
    venue: {
      name: string | null;
      city: string | null;
    } | null;
    status: {
      long: string | null;
      short: string | null;
      elapsed: number | null;
    };
  };
  league: {
    round: string | null;
  };
  teams: {
    home: {
      id: number | null;
      name: string | null;
      logo: string | null;
      winner: boolean | null;
    };
    away: {
      id: number | null;
      name: string | null;
      logo: string | null;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    fulltime?: {
      home: number | null;
      away: number | null;
    };
    extratime?: {
      home: number | null;
      away: number | null;
    };
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
};

export type ApiFootballStandingsResponse = {
  league: {
    standings: {
      rank: number;
      team: {
        id: number;
        name: string;
        logo: string | null;
      };
      points: number | null;
      goalsDiff: number | null;
      group: string;
      all: {
        played: number | null;
        win: number | null;
        draw: number | null;
        lose: number | null;
        goals: {
          for: number | null;
          against: number | null;
        };
      };
    }[][];
  };
};

export class ApiFootballClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly leagueId: number;
  private readonly season: number;

  constructor() {
    const env = getEnv();

    if (!env.API_FOOTBALL_KEY) {
      throw new Error("API_FOOTBALL_KEY is required to sync API-Football.");
    }

    this.baseUrl = env.API_FOOTBALL_BASE_URL;
    this.apiKey = env.API_FOOTBALL_KEY;
    this.leagueId = env.API_FOOTBALL_LEAGUE_ID;
    this.season = env.API_FOOTBALL_SEASON;
  }

  getTeams() {
    return this.request<ApiFootballTeamResponse[]>("/teams", {
      league: String(this.leagueId),
      season: String(this.season),
    });
  }

  getFixtures() {
    return this.request<ApiFootballFixtureResponse[]>("/fixtures", {
      league: String(this.leagueId),
      season: String(this.season),
    });
  }

  getStandings() {
    return this.request<ApiFootballStandingsResponse[]>("/standings", {
      league: String(this.leagueId),
      season: String(this.season),
    });
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": this.apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API-Football request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as ApiFootballEnvelope<T>;
    const hasErrors = Array.isArray(payload.errors)
      ? payload.errors.length > 0
      : Object.keys(payload.errors ?? {}).length > 0;

    if (hasErrors) {
      throw new Error(`API-Football returned errors: ${JSON.stringify(payload.errors)}`);
    }

    return payload.response;
  }
}
