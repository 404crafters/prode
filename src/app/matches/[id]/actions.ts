"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { matchPredictions } from "@/db/schema";
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
  _state: SavePredictionState,
  formData: FormData,
): Promise<SavePredictionState> {
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

  revalidatePath(`/matches/${match.id}`);
  revalidatePath("/matches");

  return { success: "Pronostico guardado." };
}
