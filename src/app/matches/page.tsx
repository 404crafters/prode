import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getMatchList } from "@/db/queries/matches";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const result = await getMatchesSafely();

  return (
    <AppShell>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Fixture</p>
            <h2 className="mt-1 text-2xl font-semibold">Partidos</h2>
          </div>
          {result.ok ? <p className="text-sm text-slate-500">{result.value.length} partidos</p> : null}
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Fase</th>
                  <th className="px-3 py-2 font-medium">Partido</th>
                  <th className="px-3 py-2 font-medium">Resultado</th>
                  <th className="px-3 py-2 font-medium">Carga</th>
                </tr>
              </thead>
              <tbody>
                {result.value.map((match) => (
                  <tr className="border-t border-slate-200" key={match.id}>
                    <td className="px-3 py-2 text-slate-600">{match.kickoffLabel}</td>
                    <td className="px-3 py-2">
                      {match.groupCode ? `Grupo ${match.groupCode}` : match.roundName ?? match.stage}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <Link className="text-emerald-800 hover:text-emerald-900" href={`/matches/${match.id}`}>
                        {match.homeTeamName ?? "TBD"} vs {match.awayTeamName ?? "TBD"}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {match.homeGoals === null || match.awayGoals === null
                        ? "-"
                        : `${match.homeGoals} - ${match.awayGoals}`}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          match.isPredictionOpen
                            ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                            : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        }
                      >
                        {match.isPredictionOpen ? "Abierta" : "Cerrada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

async function getMatchesSafely() {
  try {
    return { ok: true as const, value: await getMatchList() };
  } catch (error) {
    return { ok: false as const, error };
  }
}
