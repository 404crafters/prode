"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { syncFootballData } from "@/integrations/football-data/sync";
import { GROUPS_CACHE_TAG } from "@/db/queries/groups";
import { RANKING_CACHE_TAG } from "@/db/queries/ranking";
import { setUserActive, updateUserPassword, upsertUser } from "@/db/queries/users";

export type SyncNowState = {
  error?: string;
  success?: string;
};

export async function syncNowAction(state: SyncNowState): Promise<SyncNowState> {
  void state;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return { error: "No autorizado." };
  }

  try {
    const result = await syncFootballData("full");
    revalidateTag(RANKING_CACHE_TAG, "max");
    revalidateTag(GROUPS_CACHE_TAG, "max");
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/fixture");
    revalidatePath("/grupos");
    revalidatePath("/ranking");
    revalidatePath("/especiales");

    return {
      success: `Sync OK: ${result.teams} equipos, ${result.groups} grupos, ${result.matches} partidos, ${result.standings} posiciones.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo sincronizar football-data.org.",
    };
  }
}

const userInputSchema = z.object({
  username: z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_.-]+$/),
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(4).max(100),
  role: z.enum(["user", "admin"]),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const passwordInputSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(4).max(100),
});

const activeInputSchema = z.object({
  username: z.string().trim().min(1),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function saveUserAction(formData: FormData) {
  await requireAdmin();
  const input = userInputSchema.parse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    role: formData.get("role"),
    active: formData.get("active"),
  });

  await upsertUser(input);
  revalidateTag(RANKING_CACHE_TAG, "max");
  revalidatePath("/admin");
  revalidatePath("/ranking");
}

export async function changeUserPasswordAction(formData: FormData) {
  await requireAdmin();
  const input = passwordInputSchema.parse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  await updateUserPassword(input.username, input.password);
  revalidatePath("/admin");
}

export async function setUserActiveAction(formData: FormData) {
  const currentUser = await requireAdmin();
  const input = activeInputSchema.parse({
    username: formData.get("username"),
    active: formData.get("active"),
  });

  if (currentUser.username === input.username && !input.active) {
    throw new Error("No podes desactivar tu propio usuario.");
  }

  await setUserActive(input.username, input.active);
  revalidateTag(RANKING_CACHE_TAG, "max");
  revalidatePath("/admin");
  revalidatePath("/ranking");
}

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    throw new Error("No autorizado.");
  }

  return user;
}
