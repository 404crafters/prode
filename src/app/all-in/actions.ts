"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { matches, userAllIns } from "@/db/schema";
import { isMatchPredictionOpen } from "@/domain/deadlines";
import { getCurrentUser } from "@/lib/auth";
import { getNow } from "@/lib/clock";

export type SaveAllInState = {
  error?: string;
  success?: string;
};

const formSchema = z.object({
  matchId: z.string().uuid(),
});

export async function saveAllInAction(
  state: SaveAllInState,
  formData: FormData,
): Promise<SaveAllInState> {
  void state;

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tenes que iniciar sesion." };
  }

  const parsed = formSchema.safeParse({
    matchId: formData.get("matchId"),
  });

  if (!parsed.success) {
    return { error: "Partido invalido." };
  }

  const [targetMatch] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, parsed.data.matchId))
    .limit(1);

  if (!targetMatch || !isMatchPredictionOpen(targetMatch, getNow())) {
    return { error: "Ese partido ya no esta abierto para All-In." };
  }

  const [currentAllIn] = await db
    .select()
    .from(userAllIns)
    .where(eq(userAllIns.username, user.username))
    .limit(1);

  if (currentAllIn) {
    const [currentMatch] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, currentAllIn.matchId))
      .limit(1);

    if (currentMatch && !isMatchPredictionOpen(currentMatch, getNow())) {
      return { error: "Tu All-In actual ya quedo bloqueado." };
    }
  }

  await db
    .insert(userAllIns)
    .values({
      username: user.username,
      matchId: targetMatch.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userAllIns.username,
      set: {
        matchId: targetMatch.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  revalidatePath("/all-in");
  revalidatePath("/especiales");
  revalidatePath("/fixture");
  revalidatePath(`/fixture/${targetMatch.id}`);

  return { success: "All-In actualizado." };
}

export async function deleteAllInAction(
  state: SaveAllInState,
  formData: FormData,
): Promise<SaveAllInState> {
  void state;
  void formData;

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tenes que iniciar sesion." };
  }

  const [currentAllIn] = await db
    .select()
    .from(userAllIns)
    .where(eq(userAllIns.username, user.username))
    .limit(1);

  if (!currentAllIn) {
    return { success: "No tenias All-In cargado." };
  }

  const [currentMatch] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, currentAllIn.matchId))
    .limit(1);

  if (currentMatch && !isMatchPredictionOpen(currentMatch, getNow())) {
    return { error: "Tu All-In actual ya quedo bloqueado." };
  }

  await db.delete(userAllIns).where(eq(userAllIns.username, user.username));

  revalidatePath("/");
  revalidatePath("/all-in");
  revalidatePath("/especiales");
  revalidatePath("/fixture");

  if (currentMatch) {
    revalidatePath(`/fixture/${currentMatch.id}`);
  }

  return { success: "All-In eliminado." };
}
