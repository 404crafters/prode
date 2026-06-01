"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateUserPassword } from "@/db/queries/users";
import {
  createSessionToken,
  getSessionMaxAgeSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(state: LoginState, formData: FormData): Promise<LoginState> {
  void state;

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = await validateUserPassword(username, password);

  if (!user) {
    return { error: "Usuario o contrasena invalidos." };
  }

  const token = await createSessionToken(user.username);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionMaxAgeSeconds(),
    path: "/",
  });

  redirect("/");
}
