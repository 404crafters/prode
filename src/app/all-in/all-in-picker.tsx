"use client";

import { useActionState } from "react";
import { saveAllInAction, type SaveAllInState } from "./actions";

type AllInPickerProps = {
  matches: {
    id: string;
    label: string;
    phaseLabel: string;
    kickoffLabel: string;
    deadlineLabel: string;
    isCurrent: boolean;
  }[];
  disabled: boolean;
};

const initialState: SaveAllInState = {};

export function AllInPicker({ matches, disabled }: AllInPickerProps) {
  const [state, formAction, pending] = useActionState(saveAllInAction, initialState);
  const matchesByPhase = groupMatchesByPhase(matches);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select
        className="field-control text-sm"
        defaultValue={matches.find((match) => match.isCurrent)?.id ?? ""}
        disabled={disabled || pending}
        name="matchId"
        required
      >
        <option value="">Seleccionar partido</option>
        {matchesByPhase.map((phase) => (
          <optgroup key={phase.label} label={phase.label}>
            {phase.matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.label} - {match.kickoffLabel}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-emerald-700">{state.success}</p> : null}

      <button
        className="primary-button"
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? "Guardando..." : "Guardar All-In"}
      </button>
    </form>
  );
}

function groupMatchesByPhase(matches: AllInPickerProps["matches"]) {
  const phases: { label: string; matches: AllInPickerProps["matches"] }[] = [];

  for (const match of matches) {
    const phase = phases.find((candidate) => candidate.label === match.phaseLabel);

    if (phase) {
      phase.matches.push(match);
    } else {
      phases.push({ label: match.phaseLabel, matches: [match] });
    }
  }

  return phases;
}
