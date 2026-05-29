import { afterEach, describe, expect, it, vi } from "vitest";
import { getNow } from "./clock";

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
  vi.useRealTimers();
});

describe("getNow", () => {
  it("uses the real clock when simulation mode is disabled", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    process.env = {
      ...originalEnv,
      SIMULATION_MODE: "false",
      NODE_ENV: "test",
    };

    expect(getNow().toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("uses SIMULATION_NOW when simulation mode is enabled", () => {
    process.env = {
      ...originalEnv,
      SIMULATION_MODE: "true",
      SIMULATION_NOW: "2026-06-10T12:00:00-03:00",
      NODE_ENV: "test",
    };

    expect(getNow().toISOString()).toBe("2026-06-10T15:00:00.000Z");
  });

  it("fails explicitly when simulation mode has no date", () => {
    process.env = {
      ...originalEnv,
      SIMULATION_MODE: "true",
      SIMULATION_NOW: "",
      NODE_ENV: "test",
    };

    expect(() => getNow()).toThrow("SIMULATION_NOW is required");
  });
});
