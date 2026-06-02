import { config } from "dotenv";

// Standalone scripts run with tsx (seeds, football-data sync, db reset) do NOT
// get .env.local loaded automatically the way `next dev`/`next build` do. And
// because ES module imports are evaluated before any statement in the entry
// file, calling dotenv inside the script runs too late — `@/db/client` reads
// DATABASE_URL the moment it is imported. Import THIS module first (before any
// module that touches env at load time) so the env is populated in time.
config({ path: ".env.local", override: true });
