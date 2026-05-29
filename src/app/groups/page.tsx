import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getGroupsView } from "@/db/queries/groups";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const result = await getGroupsSafely();

  return (
    <AppShell>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm font-medium text-emerald-700">Fase de grupos</p>
          <h2 className="mt-1 text-2xl font-semibold">Grupos</h2>
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {result.value.map((group) => (
              <article className="rounded-lg border border-slate-200 p-4" key={group.id}>
                <h3 className="text-lg font-semibold">Grupo {group.code}</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {group.teams.map((team) => (
                    <div
                      className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                      key={team.id}
                    >
                      <span className="font-medium">{team.name}</span>
                      <span className="text-sm text-slate-500">
                        {team.standing
                          ? `#${team.standing.rank} - ${team.standing.points ?? 0} pts`
                          : `Seed ${team.seed ?? "-"}`}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

async function getGroupsSafely() {
  try {
    return { ok: true as const, value: await getGroupsView() };
  } catch (error) {
    return { ok: false as const, error };
  }
}
