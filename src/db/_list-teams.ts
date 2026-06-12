import "@/lib/load-env";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { teams } from "./schema";
import { mapTeamDisplayName } from "@/integrations/football-data/mapper";

async function main() {
  const rows = await db.select({ id: teams.id, name: teams.name }).from(teams);
  let changed = 0;
  for (const row of rows) {
    const mapped = mapTeamDisplayName(row.name);
    if (mapped !== row.name) {
      await db.update(teams).set({ name: mapped, updatedAt: new Date() }).where(eq(teams.id, row.id));
      console.log(`${row.name} -> ${mapped}`);
      changed += 1;
    }
  }
  console.log(`Done. Updated ${changed} of ${rows.length} teams.`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
