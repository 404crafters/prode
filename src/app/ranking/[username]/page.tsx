import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getRankingDetail } from "@/db/queries/ranking";

export const dynamic = "force-dynamic";

export default async function RankingDetailPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getRankingDetailSafely(username);

  if (result.ok && !result.value) {
    notFound();
  }

  const detail = result.ok ? result.value : null;

  return (
    <AppShell>
      <section className="surface rounded-lg p-6">
        <Link className="text-sm font-medium text-emerald-700" href="/ranking">
          Volver al ranking
        </Link>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {detail ? (
          <div className="mt-5 flex flex-col gap-6">
            <div>
              <p className="eyebrow">#{detail.position}</p>
              <h2 className="mt-1 text-3xl font-semibold">{detail.displayName}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {detail.totalPoints} pts - partidos {detail.matchPoints} - especiales{" "}
                {detail.specialPoints}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <StatPill label="Exactos" value={detail.exactCount} />
                <StatPill label="Full" value={detail.fullCount} />
                <StatPill label="Parciales" value={detail.partialCount} />
                <StatPill label="All-In bonus" value={detail.allInBonusPoints} />
              </div>
            </div>

            <section>
              <h3 className="text-lg font-semibold">Partidos</h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Partido</th>
                      <th>Fecha</th>
                      <th>Pronostico</th>
                      <th>Resultado</th>
                      <th>Acierto</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.matches.map((match) => (
                      <tr key={match.id}>
                        <td className="font-medium">
                          {match.label}
                          {match.isAllIn ? (
                            <span className="pill pill-open ml-2">
                              All-In
                            </span>
                          ) : null}
                        </td>
                        <td className="text-slate-600">{match.kickoffLabel}</td>
                        <td>{match.predictionLabel}</td>
                        <td>{match.resultLabel}</td>
                        <td>{match.scoreLabel}</td>
                        <td className="font-semibold">
                          {match.finalPoints}
                          {match.isAllIn ? (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              base {match.basePoints}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {detail.matches.length === 0 ? (
                      <tr>
                        <td className="text-slate-500" colSpan={6}>
                          Todavia no hay partidos puntuados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold">Especiales</h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Pronostico</th>
                      <th>Resultado</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.specials.map((special, index) => (
                      <tr key={`${special.label}-${index}`}>
                        <td className="font-medium">{special.label}</td>
                        <td>{special.predictionLabel}</td>
                        <td>{special.resultLabel}</td>
                        <td className="font-semibold">{special.points}</td>
                      </tr>
                    ))}
                    {detail.specials.length === 0 ? (
                      <tr>
                        <td className="text-slate-500" colSpan={4}>
                          Todavia no hay especiales cargados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="pill bg-slate-100 text-slate-700">
      {label}: {value}
    </span>
  );
}

async function getRankingDetailSafely(username: string) {
  try {
    return { ok: true as const, value: await getRankingDetail(username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}
