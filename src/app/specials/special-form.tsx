"use client";

import { useActionState } from "react";
import { saveSpecialPredictionAction, type SaveSpecialState } from "./actions";

type SpecialFormProps = {
  type: "group_winner" | "negative_surprise" | "champion" | "runner_up" | "third_place";
  groupId?: string;
  options: { id: string; name: string }[];
  defaultTeamId: string | null;
  disabled: boolean;
  submitLabel: string;
};

const initialState: SaveSpecialState = {};

export function SpecialForm({
  type,
  groupId,
  options,
  defaultTeamId,
  disabled,
  submitLabel,
}: SpecialFormProps) {
  const [state, formAction, pending] = useActionState(saveSpecialPredictionAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input name="type" type="hidden" value={type} />
      <input name="groupId" type="hidden" value={groupId ?? ""} />
      <select
        className="h-10 min-w-56 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 disabled:bg-slate-100"
        defaultValue={defaultTeamId ?? ""}
        disabled={disabled}
        name="teamId"
        required
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <button
        className="h-10 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
      {state.error ? <span className="text-sm font-medium text-red-700">{state.error}</span> : null}
      {state.success ? (
        <span className="text-sm font-medium text-emerald-700">{state.success}</span>
      ) : null}
    </form>
  );
}
