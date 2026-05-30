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
          <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm text-slate-500">Equipos</p>
            <p className="mt-2 text-3xl font-semibold">
              {summaryResult.ok ? summaryResult.value.counts.teams : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm text-slate-500">Partidos</p>
            <p className="mt-2 text-3xl font-semibold">
              {summaryResult.ok ? summaryResult.value.counts.matches : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm shadow-slate-200/70">
            <p className="text-sm text-slate-500">Posiciones</p>
            <p className="mt-2 text-3xl font-semibold">
              {summaryResult.ok ? summaryResult.value.counts.standings : "-"}
            </p>
          </div>
        </section>

        {!summaryResult.ok ? <SetupWarning error={summaryResult.error} /> : null}

        <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-xl font-semibold">Proximo cierre</h2>
          {dashboardResult.ok ? (
            <div className="mt-4">
              <p className="text-lg font-medium">
                {dashboardResult.value.nextDeadline
                  ? `${dashboardResult.value.nextDeadline.label}: ${dashboardResult.value.nextDeadline.dateLabel}`
                  : "No hay cierres pendientes."}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {dashboardResult.value.missingItems.length > 0 ? (
                  dashboardResult.value.missingItems.map((item) => (
                    <Link
                      className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
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
          <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-xl font-semibold">Partidos de hoy</h2>
            <div className="mt-4 flex flex-col gap-2">
              {dashboardResult.value.todayMatches.length > 0 ? (
                dashboardResult.value.todayMatches.map((match) => (
                  <Link
                    className="flex justify-between rounded-md bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
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

        <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
          <h2 className="text-xl font-semibold">Ranking</h2>
          {rankingResult.ok ? (
            <div className="mt-4 flex flex-col gap-2">
              {rankingResult.value.slice(0, 5).map((row) => (
                <Link
                  className="flex justify-between rounded-md bg-slate-50 px-3 py-2 hover:bg-emerald-50"
                  href={`/ranking/${row.username}`}
                  key={row.username}
                >
                  <span className="font-medium">#{row.position} {row.displayName}</span>
                  <span className="font-semibold">{row.totalPoints} pts</span>
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
