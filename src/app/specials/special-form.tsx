"use client";

import { useActionState } from "react";
import { saveSpecialPredictionAction, type SaveSpecialState } from "./actions";

type SpecialFormProps = {
  type: "group_winner" | "negative_surprise" | "champion" | "runner_up" | "third_place";
  groupId?: string;
  options: { id: string; name: string; flagUrl?: string | null }[];
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
        className="field-control min-w-56 text-sm"
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
        className="primary-button h-10 px-3"
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
