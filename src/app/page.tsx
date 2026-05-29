import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getAdminSummary } from "@/db/queries/admin";

export default async function Home() {
  const summaryResult = await getSummarySafely();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Equipos</p>
            <p className="mt-2 text-3xl font-semibold">
              {summaryResult.ok ? summaryResult.value.counts.teams : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Partidos</p>
            <p className="mt-2 text-3xl font-semibold">
              {summaryResult.ok ? summaryResult.value.counts.matches : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Standings</p>
            <p className="mt-2 text-3xl font-semibold">
              {summaryResult.ok ? summaryResult.value.counts.standings : "-"}
            </p>
          </div>
        </section>

        {!summaryResult.ok ? <SetupWarning error={summaryResult.error} /> : null}

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Primeras pantallas</h2>
          <div className="mt-4 flex gap-3">
            <Link className="text-sm font-medium text-emerald-700" href="/matches">
              Ver calendario
            </Link>
            <Link className="text-sm font-medium text-emerald-700" href="/groups">
              Ver grupos
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Esta home todavia es operativa. Despues va a mostrar ranking, proximo cierre y faltantes.
          </p>
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
