import { getEnv } from "@/lib/env";

export function getNow(): Date {
  const env = getEnv();

  if (!env.SIMULATION_MODE) {
    return new Date();
  }

  if (env.NODE_ENV === "production") {
    throw new Error("SIMULATION_MODE cannot be enabled in production.");
  }

  if (!env.SIMULATION_NOW) {
    throw new Error("SIMULATION_NOW is required when SIMULATION_MODE=true.");
  }

  const simulatedNow = new Date(env.SIMULATION_NOW);

  if (Number.isNaN(simulatedNow.getTime())) {
    throw new Error("SIMULATION_NOW must be a valid ISO date.");
  }

  return simulatedNow;
}
