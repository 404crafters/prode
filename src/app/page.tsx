import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TeamLabel } from "@/components/team/team-label";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getDashboardSummary } from "@/db/queries/dashboard";
import { getRanking } from "@/db/queries/ranking";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  const [rankingResult, dashboardResult] = await Promise.all([
    getRankingSafely(),
    user ? getDashboardSafely(user.username) : Promise.resolve({ ok: false as const, error: new Error("Sin sesion") }),
  ]);

  return (
    <AppShell>
      <div className="grid grid-cols-12 gap-5">
        <section className="surface col-span-12 rounded-lg p-5 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Carga pendiente</p>
              <h2 className="mt-1 text-2xl font-semibold">Proximo cierre</h2>
            </div>
            {dashboardResult.ok && dashboardResult.value.nextDeadline ? (
              <span className="rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-bold text-slate-950">
                {dashboardResult.value.nextDeadline.label}
              </span>
            ) : null}
          </div>
          {dashboardResult.ok ? (
            <div className="mt-4">
              <p className="rounded-lg bg-slate-950 px-4 py-3 text-base font-semibold text-white">
                {dashboardResult.value.nextDeadline
                  ? dashboardResult.value.nextDeadline.dateLabel
                  : "No hay cierres pendientes."}
              </p>
              <div className="mt-4 grid gap-2">
                {dashboardResult.value.missingItems.length > 0 ? (
                  dashboardResult.value.missingItems.map((item) => (
                    <Link
                      className="soft-card-link rounded-md px-3 py-2 text-sm font-semibold text-amber-950"
                      href={item.href}
                      key={`${item.kind}-${item.href}-${item.label}`}
                    >
                      <MissingItemLabel item={item} />
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
          <section className="surface col-span-12 rounded-lg p-5 lg:col-span-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Agenda</p>
                <h2 className="mt-1 text-2xl font-semibold">Partidos de hoy</h2>
              </div>
              <Link className="text-sm font-semibold text-emerald-800 hover:text-emerald-950" href="/agenda">
                Ver agenda
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {dashboardResult.value.todayMatches.length > 0 ? (
                dashboardResult.value.todayMatches.slice(0, 5).map((match) => (
                  <Link
                    className="soft-card-link flex flex-col gap-2 rounded-md px-3 py-3 text-sm"
                    href={`/fixture/${match.id}`}
                    key={match.id}
                  >
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                      <TeamLabel flagUrl={match.homeTeamFlagUrl} name={match.homeTeamName} />
                      <span className="text-slate-500">vs</span>
                      <TeamLabel flagUrl={match.awayTeamFlagUrl} name={match.awayTeamName} />
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {match.kickoffLabel} - {match.resultLabel}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-600">No hay partidos para hoy.</p>
              )}
            </div>
          </section>
        ) : null}

        <section className="surface col-span-12 rounded-lg p-5">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

function MissingItemLabel({
  item,
}: {
  item: Awaited<ReturnType<typeof getDashboardSummary>>["missingItems"][number];
}) {
  if (item.kind !== "match" || !item.homeTeamName || !item.awayTeamName) {
    return item.label;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>{item.label}</span>
      <TeamLabel flagUrl={item.homeTeamFlagUrl} name={item.homeTeamName} />
      <span className="text-slate-500">vs</span>
      <TeamLabel flagUrl={item.awayTeamFlagUrl} name={item.awayTeamName} />
    </span>
  );
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
