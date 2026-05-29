import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getAdminSummary } from "@/db/queries/admin";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const result = await getAdminSafely();

  return (
    <AppShell>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm font-medium text-emerald-700">Operacion</p>
          <h2 className="mt-1 text-2xl font-semibold">Admin</h2>
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(result.value.counts).map(([label, value]) => (
                <div className="rounded-lg border border-slate-200 p-4" key={label}>
                  <p className="text-sm capitalize text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold">Ultimos syncs</h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
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
