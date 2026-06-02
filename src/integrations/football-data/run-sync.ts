import "@/lib/load-env";
import { syncFootballData } from "./sync";

syncFootballData("full")
  .then((result) => {
    console.log("football-data sync OK", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("football-data sync failed", error);
    process.exit(1);
  });
