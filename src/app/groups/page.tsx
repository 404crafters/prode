import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getGroupsView } from "@/db/queries/groups";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const result = await getGroupsSafely();

  return (
    <AppShell>
      <section className="surface rounded-lg p-6">
        <div>
          <p className="eyebrow">Fase de grupos</p>
          <h2 className="mt-1 text-3xl font-semibold">Grupos</h2>
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {result.value.map((group) => (
              <article className="soft-card rounded-lg p-4" key={group.id}>
                <Link
                  className="inline-flex items-center rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
                  href={`/matches?group=${group.code}`}
                >
                  Grupo {group.code}
                </Link>
                <div className="mt-3 flex flex-col gap-2">
                  {group.teams.map((team) => (
                    <Link
                      className="soft-card-link flex items-center justify-between rounded-md px-3 py-2"
                      href={`/matches?team=${team.id}`}
                      key={team.id}
                    >
                      <span className="font-medium">{team.name}</span>
                      <span className="pill bg-slate-100 text-slate-600">
                        {team.standing
                          ? `#${team.standing.rank} - ${team.standing.points ?? 0} pts`
                          : team.seed
                            ? `Orden ${team.seed}`
                            : "Sin posicion"}
                      </span>
                    </Link>
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
