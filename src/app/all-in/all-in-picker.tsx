"use client";

import { useActionState } from "react";
import { saveAllInAction, type SaveAllInState } from "./actions";

type AllInPickerProps = {
  matches: {
    id: string;
    label: string;
    kickoffLabel: string;
    deadlineLabel: string;
    isCurrent: boolean;
  }[];
  disabled: boolean;
};

const initialState: SaveAllInState = {};

export function AllInPicker({ matches, disabled }: AllInPickerProps) {
  const [state, formAction, pending] = useActionState(saveAllInAction, initialState);

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
        {matches.map((match) => (
          <option key={match.id} value={match.id}>
            {match.label} - {match.kickoffLabel}
          </option>
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
