import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TeamLabel } from "@/components/team/team-label";
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
      <section className="surface rounded-lg p-6">
        <Link className="text-sm font-medium text-emerald-700" href="/fixture">
          Volver al fixture
        </Link>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {match ? (
          <div className="mt-5 flex flex-col gap-6">
            <div>
              <p className="eyebrow">
                {match.roundName ?? match.stage}
              </p>
              <h2 className="mt-1 text-3xl font-semibold">
                <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
                  <TeamLabel flagClassName="h-8 w-8" flagUrl={match.homeTeam?.flagUrl} name={match.homeTeam?.name ?? "TBD"} />
                  <span className="text-slate-500">vs</span>
                  <TeamLabel flagClassName="h-8 w-8" flagUrl={match.awayTeam?.flagUrl} name={match.awayTeam?.name ?? "TBD"} />
                </span>
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Partido: {match.kickoffLabel} - Cierre: {match.deadlineLabel}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="soft-card rounded-lg p-5">
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
                            <p className="inline-flex items-center gap-2">
                              <span>Ganador por penales:</span>
                              <TeamLabel
                                flagUrl={match.ownPrediction.predictedWinnerTeamFlagUrl}
                                name={match.ownPrediction.predictedWinnerTeamName}
                              />
                            </p>
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

              <div className="soft-card rounded-lg p-5">
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
                      className="primary-button h-10"
                      type="submit"
                    >
                      Marcar All-In
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="soft-card rounded-lg p-5">
              <h3 className="text-lg font-semibold">Resultado</h3>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                <p>
                  {match.homeGoals === null || match.awayGoals === null
                    ? "Todavia no hay resultado."
                    : `${match.homeGoals} - ${match.awayGoals}`}
                </p>
                {match.winnerTeamName ? (
                  <p className="inline-flex items-center gap-2">
                    <span>Ganador final:</span>
                    <TeamLabel flagUrl={match.winnerTeamFlagUrl} name={match.winnerTeamName} />
                  </p>
                ) : null}
                {!match.isPredictionOpen && (match.homeGoals === null || match.awayGoals === null) ? (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                    El partido ya cerro para pronosticos, pero todavia no tiene resultado.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="soft-card rounded-lg p-5">
              <h3 className="text-lg font-semibold">Pronosticos del resto</h3>
              {!match.arePredictionsVisible ? (
                <p className="mt-3 text-sm text-slate-600">
                  Se van a ver desde el dia del partido.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Pronostico</th>
                        <th>Ganador penales</th>
                        <th>Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {match.visiblePredictions.map((prediction) => (
                        <tr key={prediction.username}>
                          <td className="font-medium">{prediction.displayName}</td>
                          <td>
                            {prediction.homeGoals === null || prediction.awayGoals === null
                              ? "-"
                              : `${prediction.homeGoals} - ${prediction.awayGoals}`}
                          </td>
                          <td className="text-slate-600">
                            {prediction.predictedWinnerTeamName ? (
                              <TeamLabel
                                flagUrl={prediction.predictedWinnerTeamFlagUrl}
                                name={prediction.predictedWinnerTeamName}
                              />
                            ) : "-"}
                          </td>
                          <td className="font-semibold">
                            {prediction.finalPoints === null
                              ? "-"
                              : `${prediction.finalPoints} (${prediction.scoreLabel})`}
                            {prediction.isAllIn ? (
                              <span className="pill pill-all-in ml-2">
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
