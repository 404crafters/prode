import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TeamLabel } from "@/components/team/team-label";
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
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {result.value.map((group) => (
              <article className="soft-card overflow-hidden rounded-lg p-0" key={group.id}>
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <Link
                    className="inline-flex items-center rounded-md bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-300"
                    href={`/fixture?group=${group.code}`}
                  >
                    Grupo {group.code}
                  </Link>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Posiciones
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="w-10 text-center">#</th>
                        <th>Equipo</th>
                        <th className="text-center">PJ</th>
                        <th className="text-center">G</th>
                        <th className="text-center">E</th>
                        <th className="text-center">P</th>
                        <th className="text-center">GF</th>
                        <th className="text-center">GC</th>
                        <th className="text-center">DG</th>
                        <th className="text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.teams.map((team) => (
                        <tr key={team.id}>
                          <td className="text-center font-semibold text-slate-400">
                            {team.standing?.rank ?? team.seed ?? "-"}
                          </td>
                          <td>
                            <Link
                              className="font-semibold text-slate-100 hover:text-emerald-300"
                              href={`/fixture?team=${team.id}`}
                            >
                              <TeamLabel flagUrl={team.flagUrl} name={team.name} />
                            </Link>
                          </td>
                          <td className="text-center">{formatStat(team.standing?.played)}</td>
                          <td className="text-center">{formatStat(team.standing?.won)}</td>
                          <td className="text-center">{formatStat(team.standing?.drawn)}</td>
                          <td className="text-center">{formatStat(team.standing?.lost)}</td>
                          <td className="text-center">{formatStat(team.standing?.goalsFor)}</td>
                          <td className="text-center">{formatStat(team.standing?.goalsAgainst)}</td>
                          <td className="text-center">{formatSignedStat(team.standing?.goalDifference)}</td>
                          <td className="text-center">
                            <span className="points-chip points-positive">
                              {formatStat(team.standing?.points)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

function formatStat(value: number | null | undefined) {
  return value ?? "-";
}

function formatSignedStat(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return value > 0 ? `+${value}` : value;
}
