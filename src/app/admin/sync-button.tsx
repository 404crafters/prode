"use client";

import { useActionState } from "react";
import { syncNowAction, type SyncNowState } from "./actions";

const initialState: SyncNowState = {};

export function SyncButton() {
  const [state, formAction, pending] = useActionState(syncNowAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        className="primary-button h-10"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sincronizando..." : "Sincronizar API-Football"}
      </button>
      {state.error ? <span className="text-sm font-medium text-red-700">{state.error}</span> : null}
      {state.success ? (
        <span className="text-sm font-medium text-emerald-700">{state.success}</span>
      ) : null}
    </form>
  );
}
