import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getAdminSummary } from "@/db/queries/admin";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { SyncButton } from "./sync-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const result = await getAdminSafely();
  const env = getEnv();

  return (
    <AppShell>
      <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
        <div>
          <p className="text-sm font-medium text-emerald-700">Operacion</p>
          <h2 className="mt-1 text-2xl font-semibold">Admin</h2>
        </div>

        <div className="mt-5">
          <SyncButton />
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(result.value.counts).map(([label, value]) => (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={label}>
                  <p className="text-sm text-slate-500">{getCountLabel(label)}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Simulacion</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">SIMULATION_MODE</p>
                  <p className="mt-1 font-semibold">{env.SIMULATION_MODE ? "true" : "false"}</p>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">SIMULATION_NOW</p>
                  <p className="mt-1 font-semibold">{env.SIMULATION_NOW ?? "-"}</p>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-slate-950 p-4 font-mono text-xs text-slate-100">
                <p>npm run db:seed:pre-worldcup</p>
                <p>npm run db:seed:group-stage-mid</p>
                <p>npm run db:seed:knockouts-mid</p>
                <p>npm run db:seed:finished-worldcup</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Ultimos syncs</h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Inicio</th>
                      <th className="px-3 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.value.recentSyncRuns.map((run) => (
                      <tr className="border-t border-slate-200" key={run.id}>
                        <td className="px-3 py-2">{run.type}</td>
                        <td className="px-3 py-2">{run.status}</td>
                        <td className="px-3 py-2 text-slate-600">{run.startedAt}</td>
                        <td className="px-3 py-2 text-slate-600">{run.errorMessage ?? "-"}</td>
                      </tr>
                    ))}
                    {result.value.recentSyncRuns.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-slate-500" colSpan={4}>
                          Todavia no hay syncs registrados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

async function getAdminSafely() {
  try {
    return { ok: true as const, value: await getAdminSummary() };
  } catch (error) {
    return { ok: false as const, error };
  }
}

function getCountLabel(label: string) {
  const labels: Record<string, string> = {
    teams: "Equipos",
    groups: "Grupos",
    matches: "Partidos",
    standings: "Posiciones",
    predictions: "Pronosticos",
    specials: "Especiales",
    allIns: "All-In",
  };

  return labels[label] ?? label;
}
