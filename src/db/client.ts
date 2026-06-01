import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof drizzle<typeof schema>>;
  postgresClient?: postgres.Sql;
};

function getPostgresClient(): postgres.Sql {
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(requireEnv("DATABASE_URL"), {
      idle_timeout: 30,
      max: process.env.NODE_ENV === "production" ? 5 : 10,
      prepare: false,
      ssl: "require",
    });
  }

  return globalForDb.postgresClient;
}

export async function closeDbConnection() {
  if (globalForDb.postgresClient) {
    await globalForDb.postgresClient.end();
    globalForDb.db = undefined;
    globalForDb.postgresClient = undefined;
  }
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getPostgresClient(), { schema });
  }

  return globalForDb.db;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
