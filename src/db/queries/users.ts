import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { withDbTimeout } from "@/db/with-timeout";
import { appUsers } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

export type AppUserRole = "user" | "admin";

export type AppUser = {
  username: string;
  displayName: string;
  role: AppUserRole;
  active: boolean;
};

export type AdminUserView = AppUser & {
  createdAt: Date;
  updatedAt: Date;
};

export async function getUserByUsername(username: string): Promise<AppUser | null> {
  const [user] = await withDbTimeout(
    db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1),
    "getUserByUsername",
  );

  return user && user.active ? toAppUser(user) : null;
}

export async function getActiveUsers(): Promise<AppUser[]> {
  const rows = await withDbTimeout(
    db.select().from(appUsers).orderBy(asc(appUsers.displayName)),
    "getActiveUsers",
  );
  return rows.filter((user) => user.active).map(toAppUser);
}

export async function getAdminUsers(): Promise<AdminUserView[]> {
  const rows = await withDbTimeout(
    db.select().from(appUsers).orderBy(asc(appUsers.displayName)),
    "getAdminUsers",
  );
  return rows.map((user) => ({
    ...toAppUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export async function validateUserPassword(username: string, password: string): Promise<AppUser | null> {
  const [user] = await withDbTimeout(
    db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1),
    "validateUserPassword",
  );

  if (!user || !user.active) {
    return null;
  }

  return (await verifyPassword(password, user.passwordHash)) ? toAppUser(user) : null;
}

export async function upsertUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: AppUserRole;
  active: boolean;
}) {
  const passwordHash = await hashPassword(input.password);

  await db
    .insert(appUsers)
    .values({
      username: input.username,
      passwordHash,
      displayName: input.displayName,
      role: input.role,
      active: input.active,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appUsers.username,
      set: {
        passwordHash,
        displayName: input.displayName,
        role: input.role,
        active: input.active,
        updatedAt: new Date(),
      },
    });
}

export async function updateUserPassword(username: string, password: string) {
  await db
    .update(appUsers)
    .set({
      passwordHash: await hashPassword(password),
      updatedAt: new Date(),
    })
    .where(eq(appUsers.username, username));
}

export async function setUserActive(username: string, active: boolean) {
  await db.update(appUsers).set({ active, updatedAt: new Date() }).where(eq(appUsers.username, username));
}

function toAppUser(user: typeof appUsers.$inferSelect): AppUser {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role === "admin" ? "admin" : "user",
    active: user.active,
  };
}
