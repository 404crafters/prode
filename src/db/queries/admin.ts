import { count, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { withDbTimeout } from "@/db/with-timeout";
import { appUsers, groups, matches, standings, syncRuns, teams } from "@/db/schema";
import { formatArgentinaDateTime } from "@/lib/date";

export type AdminSummary = {
  counts: {
    teams: number;
    groups: number;
    matches: number;
    standings: number;
    users: number;
  };
  recentSyncRuns: {
    id: string;
    type: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    errorMessage: string | null;
  }[];
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const [teamCount, groupCount, matchCount, standingCount, userCount, recentSyncRuns] = await withDbTimeout(
    Promise.all([
      db.select({ value: count() }).from(teams),
      db.select({ value: count() }).from(groups),
      db.select({ value: count() }).from(matches),
      db.select({ value: count() }).from(standings),
      db.select({ value: count() }).from(appUsers),
      db.select().from(syncRuns).orderBy(desc(syncRuns.startedAt)).limit(8),
    ]),
    "getAdminSummary",
  );

  return {
    counts: {
      teams: teamCount[0]?.value ?? 0,
      groups: groupCount[0]?.value ?? 0,
      matches: matchCount[0]?.value ?? 0,
      standings: standingCount[0]?.value ?? 0,
      users: userCount[0]?.value ?? 0,
    },
    recentSyncRuns: recentSyncRuns.map((run) => ({
      id: run.id,
      type: run.type,
      status: run.status,
      startedAt: formatArgentinaDateTime(run.startedAt),
      finishedAt: run.finishedAt ? formatArgentinaDateTime(run.finishedAt) : null,
      errorMessage: run.errorMessage,
    })),
  };
}
