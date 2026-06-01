"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { matches, matchPredictions, userAllIns } from "@/db/schema";
import { getPredictionMatch } from "@/db/queries/match-detail";
import { isMatchPredictionOpen } from "@/domain/deadlines";
import { normalizePredictedWinner, validateMatchPredictionInput } from "@/domain/predictions";
import { getCurrentUser } from "@/lib/auth";
import { getNow } from "@/lib/clock";

export type SavePredictionState = {
  error?: string;
  success?: string;
};

const formSchema = z.object({
  matchId: z.string().uuid(),
  homeGoals: z.coerce.number().int().min(0),
  awayGoals: z.coerce.number().int().min(0),
  predictedWinnerTeamId: z.string().uuid().or(z.literal("")).optional(),
});

export async function saveMatchPredictionAction(
  state: SavePredictionState,
  formData: FormData,
): Promise<SavePredictionState> {
  void state;

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tenes que iniciar sesion." };
  }

  const parsed = formSchema.safeParse({
    matchId: formData.get("matchId"),
    homeGoals: formData.get("homeGoals"),
    awayGoals: formData.get("awayGoals"),
    predictedWinnerTeamId: formData.get("predictedWinnerTeamId") ?? "",
  });

  if (!parsed.success) {
    return { error: "Revisa los datos del pronostico." };
  }

  const match = await getPredictionMatch(parsed.data.matchId);

  if (!match) {
    return { error: "El partido no existe." };
  }

  if (!isMatchPredictionOpen(match, getNow())) {
    return { error: "La carga de este partido ya cerro." };
  }

  const input = {
    homeGoals: parsed.data.homeGoals,
    awayGoals: parsed.data.awayGoals,
    predictedWinnerTeamId: parsed.data.predictedWinnerTeamId || null,
  };
  const validationError = validateMatchPredictionInput(match, input);

  if (validationError) {
    return { error: validationError };
  }

  await db
    .insert(matchPredictions)
    .values({
      username: user.username,
      matchId: match.id,
      homeGoals: input.homeGoals,
      awayGoals: input.awayGoals,
      predictedWinnerTeamId: normalizePredictedWinner(match, input),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [matchPredictions.username, matchPredictions.matchId],
      set: {
        homeGoals: input.homeGoals,
        awayGoals: input.awayGoals,
        predictedWinnerTeamId: normalizePredictedWinner(match, input),
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/fixture/${match.id}`);
  revalidatePath("/fixture");

  return { success: "Pronostico guardado." };
}

export async function setAllInAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  const matchId = String(formData.get("matchId") ?? "");
  const match = await getPredictionMatch(matchId);

  if (!match || !isMatchPredictionOpen(match, getNow())) {
    revalidatePath(`/fixture/${matchId}`);
    return;
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
      revalidatePath(`/fixture/${matchId}`);
      return;
    }
  }

  await db
    .insert(userAllIns)
    .values({
      username: user.username,
      matchId: match.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userAllIns.username,
      set: {
        matchId: match.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/fixture/${match.id}`);
  revalidatePath("/fixture");
}
