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
          className="field-control text-base"
          name="username"
          autoComplete="username"
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Contrasena
        <input
          className="field-control text-base"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {state.error ? <p className="text-sm font-medium text-red-700">{state.error}</p> : null}

      <button
        className="primary-button"
        disabled={pending}
        type="submit"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
