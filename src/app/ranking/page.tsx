import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getRanking } from "@/db/queries/ranking";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const result = await getRankingSafely();

  return (
    <AppShell>
      <section className="surface rounded-lg p-6">
        <div>
          <p className="eyebrow">Tabla general</p>
          <h2 className="mt-1 text-3xl font-semibold">Ranking</h2>
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Usuario</th>
                  <th>Total</th>
                  <th>Partidos</th>
                  <th>Aciertos</th>
                  <th>All-In bonus</th>
                  <th>Especiales</th>
                </tr>
              </thead>
              <tbody>
                {result.value.map((row) => (
                  <tr key={row.username}>
                    <td className="font-semibold">#{row.position}</td>
                    <td className="font-medium">
                      <Link className="text-emerald-800 hover:text-emerald-900" href={`/ranking/${row.username}`}>
                        {row.displayName}
                      </Link>
                    </td>
                    <td><PointsChip points={row.totalPoints} /></td>
                    <td><PointsChip points={row.matchPoints} /></td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <ScoreCountBadge className="score-exact" label="Exacto" value={row.exactCount} />
                        <ScoreCountBadge className="score-full" label="Full" value={row.fullCount} />
                        <ScoreCountBadge className="score-partial" label="Parcial" value={row.partialCount} />
                      </div>
                    </td>
                    <td><PointsChip points={row.allInBonusPoints} /></td>
                    <td><PointsChip points={row.specialPoints} /></td>
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

function PointsChip({ points }: { points: number }) {
  return (
    <span className={points > 0 ? "points-chip points-positive" : "points-chip points-zero"}>
      {points}
    </span>
  );
}

function ScoreCountBadge({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: number;
}) {
  return <span className={`score-badge ${className}`}>{label} {value}</span>;
}

async function getRankingSafely() {
  try {
    return { ok: true as const, value: await getRanking() };
  } catch (error) {
    return { ok: false as const, error };
  }
}
