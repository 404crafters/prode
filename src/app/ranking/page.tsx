import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getRanking } from "@/db/queries/ranking";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const result = await getRankingSafely();

  return (
    <AppShell>
      <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
        <div>
          <p className="text-sm font-medium text-emerald-700">Tabla general</p>
          <h2 className="mt-1 text-2xl font-semibold">Ranking</h2>
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Pos</th>
                  <th className="px-3 py-2 font-medium">Usuario</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Partidos</th>
                  <th className="px-3 py-2 font-medium">Aciertos</th>
                  <th className="px-3 py-2 font-medium">All-In bonus</th>
                  <th className="px-3 py-2 font-medium">Especiales</th>
                </tr>
              </thead>
              <tbody>
                {result.value.map((row) => (
                  <tr className="border-t border-slate-200" key={row.username}>
                    <td className="px-3 py-2 font-semibold">#{row.position}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link className="text-emerald-800 hover:text-emerald-900" href={`/ranking/${row.username}`}>
                        {row.displayName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-semibold">{row.totalPoints}</td>
                    <td className="px-3 py-2">{row.matchPoints}</td>
                    <td className="px-3 py-2 text-slate-600">
                      E {row.exactCount} / F {row.fullCount} / P {row.partialCount}
                    </td>
                    <td className="px-3 py-2">{row.allInBonusPoints}</td>
                    <td className="px-3 py-2">{row.specialPoints}</td>
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

async function getRankingSafely() {
  try {
    return { ok: true as const, value: await getRanking() };
  } catch (error) {
    return { ok: false as const, error };
  }
}
