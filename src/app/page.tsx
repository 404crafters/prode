import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getAdminSummary } from "@/db/queries/admin";
import { getDashboardSummary } from "@/db/queries/dashboard";
import { getRanking } from "@/db/queries/ranking";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  const summaryResult = await getSummarySafely();
  const rankingResult = await getRankingSafely();
  const dashboardResult = user
    ? await getDashboardSafely(user.username)
    : { ok: false as const, error: new Error("Sin sesion") };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-3 gap-4">
          <div className="metric-card rounded-lg p-5">
            <p className="text-sm font-medium text-slate-500">Equipos</p>
            <p className="mt-2 text-4xl font-bold">
              {summaryResult.ok ? summaryResult.value.counts.teams : "-"}
            </p>
          </div>
          <div className="metric-card rounded-lg p-5">
            <p className="text-sm font-medium text-slate-500">Partidos</p>
            <p className="mt-2 text-4xl font-bold">
              {summaryResult.ok ? summaryResult.value.counts.matches : "-"}
            </p>
          </div>
          <div className="metric-card rounded-lg p-5">
            <p className="text-sm font-medium text-slate-500">Posiciones</p>
            <p className="mt-2 text-4xl font-bold">
              {summaryResult.ok ? summaryResult.value.counts.standings : "-"}
            </p>
          </div>
        </section>

        {!summaryResult.ok ? <SetupWarning error={summaryResult.error} /> : null}

        <section className="surface rounded-lg p-6">
          <p className="eyebrow">Carga pendiente</p>
          <h2 className="mt-1 text-2xl font-semibold">Proximo cierre</h2>
          {dashboardResult.ok ? (
            <div className="mt-4">
              <p className="rounded-lg bg-slate-950 px-4 py-3 text-lg font-semibold text-white">
                {dashboardResult.value.nextDeadline
                  ? `${dashboardResult.value.nextDeadline.label}: ${dashboardResult.value.nextDeadline.dateLabel}`
                  : "No hay cierres pendientes."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {dashboardResult.value.missingItems.length > 0 ? (
                  dashboardResult.value.missingItems.map((item) => (
                    <Link
                      className="soft-card-link rounded-md px-3 py-2 text-sm font-semibold text-amber-950"
                      href={item.href}
                      key={`${item.kind}-${item.label}`}
                    >
                      {item.label}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No tenes faltantes para el proximo cierre.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4"><SetupWarning error={dashboardResult.error} /></div>
          )}
        </section>

        {dashboardResult.ok ? (
          <section className="surface rounded-lg p-6">
            <p className="eyebrow">Agenda</p>
            <h2 className="mt-1 text-2xl font-semibold">Partidos de hoy</h2>
            <div className="mt-4 flex flex-col gap-2">
              {dashboardResult.value.todayMatches.length > 0 ? (
                dashboardResult.value.todayMatches.map((match) => (
                  <Link
                    className="soft-card-link flex justify-between rounded-md px-3 py-3 text-sm"
                    href={`/matches/${match.id}`}
                    key={match.id}
                  >
                    <span className="font-medium">{match.label}</span>
                    <span className="text-slate-600">
                      {match.kickoffLabel} - {match.resultLabel}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-600">No hay partidos para la fecha simulada/actual.</p>
              )}
            </div>
          </section>
        ) : null}

        <section className="surface rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Tabla general</p>
              <h2 className="mt-1 text-2xl font-semibold">Ranking</h2>
            </div>
            <Link className="text-sm font-semibold text-emerald-800 hover:text-emerald-950" href="/ranking">
              Ver completo
            </Link>
          </div>
          {rankingResult.ok ? (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {rankingResult.value.slice(0, 5).map((row) => (
                <Link
                  className="soft-card-link rounded-lg p-4"
                  href={`/ranking/${row.username}`}
                  key={row.username}
                >
                  <span className="pill bg-slate-950 text-white">#{row.position}</span>
                  <p className="mt-3 font-semibold">{row.displayName}</p>
                  <div className="mt-3">
                    <PointsChip points={row.totalPoints} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <ScoreCountBadge className="score-exact" label="E" value={row.exactCount} />
                    <ScoreCountBadge className="score-full" label="F" value={row.fullCount} />
                    <ScoreCountBadge className="score-partial" label="P" value={row.partialCount} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4"><SetupWarning error={rankingResult.error} /></div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

async function getSummarySafely() {
  try {
    return { ok: true as const, value: await getAdminSummary() };
  } catch (error) {
    return { ok: false as const, error };
  }
}

function PointsChip({ points }: { points: number }) {
  return <span className="points-chip points-positive">{points} pts</span>;
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

async function getDashboardSafely(username: string) {
  try {
    return { ok: true as const, value: await getDashboardSummary(username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}
