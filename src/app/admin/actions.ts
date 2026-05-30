"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { syncApiFootball } from "@/integrations/api-football/sync";

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
    const result = await syncApiFootball("full");
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/matches");
    revalidatePath("/groups");
    revalidatePath("/ranking");
    revalidatePath("/specials");

    return {
      success: `Sync OK: ${result.teams} equipos, ${result.groups} grupos, ${result.matches} partidos, ${result.standings} posiciones.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo sincronizar API-Football.",
    };
  }
}
