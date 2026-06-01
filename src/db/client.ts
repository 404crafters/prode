import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

const client = postgres(requireEnv("DATABASE_URL"), {
  prepare: false,
  ssl: "require",
});

export async function closeDbConnection() {
  await client.end();
}

export const db = drizzle(client, { schema });
