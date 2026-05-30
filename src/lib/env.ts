import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  API_FOOTBALL_KEY: z.string().min(1).optional(),
  API_FOOTBALL_BASE_URL: z.string().url().default("https://v3.football.api-sports.io"),
  API_FOOTBALL_LEAGUE_ID: z.coerce.number().int().positive().default(1),
  API_FOOTBALL_SEASON: z.coerce.number().int().positive().default(2026),
  SIMULATION_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SIMULATION_NOW: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}

export function requireEnv(name: keyof AppEnv): string {
  const value = getEnv()[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}
