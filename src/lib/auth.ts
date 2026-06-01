import type { AppUser } from "@/db/queries/users";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function getCurrentUser(): Promise<AppUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const { getUserByUsername } = await import("@/db/queries/users");
  return getUserByUsername(session.username);
}
