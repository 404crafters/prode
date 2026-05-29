import { jwtVerify, SignJWT } from "jose";
import { findUser, type AppUser } from "@/config/users";

export const SESSION_COOKIE_NAME = "prode_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  username: string;
};

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return new TextEncoder().encode(secret ?? "dev-session-secret");
}

export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<AppUser | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSessionSecret());

    if (!payload.username) {
      return null;
    }

    return findUser(payload.username) ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_DURATION_SECONDS;
}
