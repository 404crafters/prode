import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
};

function getPostgresClient(): postgres.Sql {
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(requireEnv("DATABASE_URL"), {
      connect_timeout: 10,
      idle_timeout: 20,
      max: 1,
      prepare: false,
      ssl: "require",
    });
  }

  return globalForDb.postgresClient;
}

export async function closeDbConnection() {
  if (globalForDb.postgresClient) {
    await globalForDb.postgresClient.end();
    globalForDb.postgresClient = undefined;
  }
}

export function getDb() {
  return drizzle(getPostgresClient(), { schema });
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
