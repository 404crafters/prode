import { config } from "dotenv";
import { closeDbConnection } from "@/db/client";
import { syncApiFootball } from "./sync";

config({ path: ".env.local", override: true });

syncApiFootball("full")
  .then(async (result) => {
    console.log(`Sync OK: ${JSON.stringify(result)}`);
    await closeDbConnection();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDbConnection();
    process.exit(1);
  });
