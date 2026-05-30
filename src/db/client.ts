import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
};

function getPostgresClient(): postgres.Sql {
  const client =
    globalForDb.postgresClient ??
    postgres(requireEnv("DATABASE_URL"), {
      prepare: false,
      ssl: "require",
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgresClient = client;
  }

  return client;
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
