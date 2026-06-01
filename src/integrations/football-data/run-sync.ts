import { config } from "dotenv";
import { syncFootballData } from "./sync";

config({ path: ".env.local" });

syncFootballData("full")
  .then((result) => {
    console.log("football-data sync OK", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("football-data sync failed", error);
    process.exit(1);
  });
