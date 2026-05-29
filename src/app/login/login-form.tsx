"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Usuario
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950 outline-none focus:border-emerald-600"
          name="username"
          autoComplete="username"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Contrasena
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950 outline-none focus:border-emerald-600"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}

      <button
        className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
