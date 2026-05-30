import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getMatchDetail } from "@/db/queries/match-detail";
import { getCurrentUser } from "@/lib/auth";
import { setAllInAction } from "./actions";
import { PredictionForm } from "./prediction-form";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    notFound();
  }

  const result = await getMatchSafely(id, user.username);

  if (result.ok && !result.value) {
    notFound();
  }

  const match = result.ok ? result.value : null;

  return (
    <AppShell>
      <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
        <Link className="text-sm font-medium text-emerald-700" href="/matches">
          Volver a partidos
        </Link>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {match ? (
          <div className="mt-5 flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {match.roundName ?? match.stage}
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {match.homeTeam?.name ?? "TBD"} vs {match.awayTeam?.name ?? "TBD"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Partido: {match.kickoffLabel} - Cierre: {match.deadlineLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Mi pronostico</h3>
                <div className="mt-4">
                  {match.isPredictionOpen && match.homeTeam && match.awayTeam ? (
                    <PredictionForm
                      awayTeam={match.awayTeam}
                      defaultValue={match.ownPrediction}
                      homeTeam={match.homeTeam}
                      matchId={match.id}
                      stage={match.stage}
                    />
                  ) : (
                    <div className="flex flex-col gap-3 text-sm text-slate-700">
                      {match.ownPrediction ? (
                        <>
                          <p className="text-lg font-semibold text-slate-950">
                            {match.ownPrediction.homeGoals} - {match.ownPrediction.awayGoals}
                          </p>
                          {match.ownPrediction.predictedWinnerTeamName ? (
                            <p>Ganador por penales: {match.ownPrediction.predictedWinnerTeamName}</p>
                          ) : null}
                          {match.ownPrediction.isScored ? (
                            <p>
                              Puntos:{" "}
                              <span className="font-semibold text-slate-950">
                                {match.ownPrediction.finalPoints} ({match.ownPrediction.scoreLabel})
                              </span>
                              {match.isAllIn && match.ownPrediction.basePoints !== null ? (
                                <span className="ml-2 text-slate-500">
                                  base {match.ownPrediction.basePoints}
                                </span>
                              ) : null}
                            </p>
                          ) : (
                            <p>
                              {match.homeGoals === null || match.awayGoals === null
                                ? "Pronostico cerrado. Esperando resultado."
                                : "Resultado cargado, pendiente de puntuacion."}
                            </p>
                          )}
                        </>
                      ) : (
                        <p>
                          {match.homeGoals === null || match.awayGoals === null
                            ? "No cargaste pronostico para este partido. La carga ya cerro."
                            : "No cargaste pronostico para este partido. Suma 0 puntos."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">All-In</h3>
                <p className="mt-4 text-sm text-slate-600">
                  {match.isAllIn
                    ? "Este es tu partido All-In."
                    : match.canSetAllIn
                      ? "Podes usar tu All-In en este partido."
                      : "No podes mover el All-In a este partido."}
                </p>
                {match.canSetAllIn && !match.isAllIn ? (
                  <form action={setAllInAction} className="mt-4">
                    <input name="matchId" type="hidden" value={match.id} />
                    <button
                      className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                      type="submit"
                    >
                      Marcar All-In
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Resultado</h3>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                <p>
                  {match.homeGoals === null || match.awayGoals === null
                    ? "Todavia no hay resultado."
                    : `${match.homeGoals} - ${match.awayGoals}`}
                </p>
                {match.winnerTeamName ? <p>Ganador final: {match.winnerTeamName}</p> : null}
                {!match.isPredictionOpen && (match.homeGoals === null || match.awayGoals === null) ? (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                    El partido ya cerro para pronosticos, pero todavia no tiene resultado.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Pronosticos del resto</h3>
              {!match.arePredictionsVisible ? (
                <p className="mt-3 text-sm text-slate-600">
                  Se van a ver desde el dia del partido.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Usuario</th>
                        <th className="px-3 py-2 font-medium">Pronostico</th>
                        <th className="px-3 py-2 font-medium">Ganador penales</th>
                        <th className="px-3 py-2 font-medium">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {match.visiblePredictions.map((prediction) => (
                        <tr className="border-t border-slate-200" key={prediction.username}>
                          <td className="px-3 py-2 font-medium">{prediction.displayName}</td>
                          <td className="px-3 py-2">
                            {prediction.homeGoals === null || prediction.awayGoals === null
                              ? "-"
                              : `${prediction.homeGoals} - ${prediction.awayGoals}`}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {prediction.predictedWinnerTeamName ?? "-"}
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {prediction.finalPoints === null
                              ? "-"
                              : `${prediction.finalPoints} (${prediction.scoreLabel})`}
                            {prediction.isAllIn ? (
                              <span className="ml-2 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                                All-In
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

async function getMatchSafely(matchId: string, username: string) {
  try {
    return { ok: true as const, value: await getMatchDetail(matchId, username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}
