"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUser } from "@/config/users";
import {
  createSessionToken,
  getSessionMaxAgeSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(state: LoginState, formData: FormData): Promise<LoginState> {
  void state;

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = findUser(username);

  if (!user || user.password !== password) {
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
