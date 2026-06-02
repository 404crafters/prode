import { describe, expect, it } from "vitest";
import { getNextDashboardDeadline } from "./dashboard-deadlines";

describe("dashboard deadlines", () => {
  it("merges missing items from candidates that close at the same time", () => {
    const deadline = new Date("2026-06-11T03:00:00.000Z");

    const next = getNextDashboardDeadline([
      {
        label: "Pronosticos de partidos",
        deadline,
        missingItems: ["match"],
      },
      {
        label: "Inicio del Mundial",
        deadline,
        missingItems: ["lideres", "sorpresa"],
        labelPriority: 1,
      },
    ]);

    expect(next).toEqual({
      label: "Inicio del Mundial",
      deadline,
      missingItems: ["match", "lideres", "sorpresa"],
    });
  });

  it("keeps later deadline items out of the next close", () => {
    const firstDeadline = new Date("2026-06-11T03:00:00.000Z");
    const laterDeadline = new Date("2026-06-12T03:00:00.000Z");

    const next = getNextDashboardDeadline([
      {
        label: "Pronosticos de partidos",
        deadline: laterDeadline,
        missingItems: ["later"],
      },
      {
        label: "Inicio del Mundial",
        deadline: firstDeadline,
        missingItems: ["first"],
      },
    ]);

    expect(next?.missingItems).toEqual(["first"]);
  });
});
