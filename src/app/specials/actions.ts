"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NEGATIVE_SURPRISE_TEAM_NAMES } from "@/config/game";
import { db } from "@/db/client";
import { groupTeams, matches, specialPredictions, teams } from "@/db/schema";
import { getKnockoutStartDeadline, getTournamentStartDeadline } from "@/domain/deadlines";
import { getCurrentUser } from "@/lib/auth";
import { getNow } from "@/lib/clock";

export type SaveSpecialState = {
  error?: string;
  success?: string;
};

const formSchema = z.object({
  type: z.enum(["group_winner", "negative_surprise", "champion", "runner_up", "third_place"]),
  groupId: z.string().uuid().or(z.literal("")).optional(),
  teamId: z.string().uuid(),
});

export async function saveSpecialPredictionAction(
  state: SaveSpecialState,
  formData: FormData,
): Promise<SaveSpecialState> {
  void state;

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Tenes que iniciar sesion." };
  }

  const parsed = formSchema.safeParse({
    type: formData.get("type"),
    groupId: formData.get("groupId") ?? "",
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    return { error: "Revisa la seleccion." };
  }

  const { type, teamId } = parsed.data;
  const groupId = parsed.data.groupId || null;
  const matchRows = await db.select().from(matches);
  const now = getNow();

  if (type === "group_winner" || type === "negative_surprise") {
    const deadline = getTournamentStartDeadline(matchRows);

    if (!deadline || now.getTime() >= deadline.getTime()) {
      return { error: "Esta carga ya cerro." };
    }
  } else {
    const deadline = getKnockoutStartDeadline(matchRows.filter((match) => match.stage !== "group"));

    if (!deadline || now.getTime() >= deadline.getTime()) {
      return { error: "Esta carga ya cerro." };
    }
  }

  const validationError = await validateSpecial(type, teamId, groupId);

  if (validationError) {
    return { error: validationError };
  }

  const scopeKey = type === "group_winner" ? groupId : "global";

  await db
    .insert(specialPredictions)
    .values({
      username: user.username,
      type,
      scopeKey: scopeKey ?? "global",
      groupId,
      teamId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        specialPredictions.username,
        specialPredictions.type,
        specialPredictions.scopeKey,
      ],
      set: {
        teamId,
        groupId,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/specials");
  revalidatePath("/");

  return { success: "Especial guardado." };
}

async function validateSpecial(type: string, teamId: string, groupId: string | null) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

  if (!team) {
    return "La seleccion no existe.";
  }

  if (type === "group_winner") {
    if (!groupId) {
      return "Falta el grupo.";
    }

    const [membership] = await db
      .select()
      .from(groupTeams)
      .where(and(eq(groupTeams.groupId, groupId), eq(groupTeams.teamId, teamId)))
      .limit(1);

    if (!membership) {
      return "La seleccion no pertenece al grupo.";
    }
  }

  if (type === "negative_surprise") {
    const allowed = NEGATIVE_SURPRISE_TEAM_NAMES.some(
      (name) => normalizeName(name) === normalizeName(team.name),
    );

    if (!allowed) {
      return "La seleccion no esta permitida para sorpresa negativa.";
    }
  }

  return null;
}

function normalizeName(name: string): string {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
