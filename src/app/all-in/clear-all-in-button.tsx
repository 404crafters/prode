"use client";

import { useActionState } from "react";
import { deleteAllInAction, type SaveAllInState } from "./actions";

const initialState: SaveAllInState = {};

export function ClearAllInButton({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(deleteAllInAction, initialState);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <button
        className="h-10 rounded-md border border-red-400/40 bg-red-950/30 px-3 text-sm font-semibold text-red-100 hover:bg-red-900/50 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? "Quitando..." : "Quitar All-In"}
      </button>
      {state.error ? <p className="text-sm font-medium text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-emerald-300">{state.success}</p> : null}
    </form>
  );
}
