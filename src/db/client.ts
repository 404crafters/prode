import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

const connectionString = requireEnv("DATABASE_URL");

// Reuse a single postgres-js client across HMR reloads in dev. Without this
// guard every Turbopack hot reload would create a brand new pool whose idle
// connections never close, slowly exhausting Supabase's pooler.
const globalForDb = globalThis as unknown as {
  __prodePgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__prodePgClient ??
  postgres(connectionString, {
    // The Supabase transaction pooler (Supavisor, port 6543) does not support
    // named prepared statements.
    prepare: false,
    ssl: "require",
    // A page can legitimately fan out ~14 queries at once (e.g. the home loads
    // ranking + dashboard concurrently), so the pool needs real headroom or
    // those queries serialize and time out. The transaction pooler handles this
    // fine; withDbTimeout is what protects us from a stale connection, not a
    // tiny pool. If one socket goes stale, the other connections keep serving
    // and the bad one gets recycled.
    max: 10,
    // Don't keep sockets alive across the serverless freeze gap, and recycle
    // long-lived connections so a stale one can't linger.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    // Fail fast when the pooler / instance is unreachable instead of hanging.
    connect_timeout: 10,
    // Server-side cap: Postgres cancels any statement that actually reaches a
    // live backend but runs too long. (The app-level withDbTimeout covers the
    // case where the query never reaches a live backend at all.)
    connection: { statement_timeout: 8000, application_name: "prode-web" },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__prodePgClient = client;
}

export async function closeDbConnection() {
  await client.end();
}

export const db = drizzle(client, { schema });
