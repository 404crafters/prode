import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getAllInView } from "@/db/queries/all-in";
import { getSpecialsView } from "@/db/queries/specials";
import { getCurrentUser } from "@/lib/auth";
import { AllInPicker } from "../all-in/all-in-picker";
import { SpecialForm } from "./special-form";

export const dynamic = "force-dynamic";

export default async function SpecialsPage() {
  const user = await getCurrentUser();
  const result = user
    ? await getSpecialsSafely(user.username)
    : { ok: false as const, error: new Error("Sin sesion") };
  const allInResult = user
    ? await getAllInSafely(user.username)
    : { ok: false as const, error: new Error("Sin sesion") };

  return (
    <AppShell>
      <section className="rounded-lg border border-white/80 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
        <div>
          <p className="text-sm font-medium text-emerald-700">Pronosticos especiales</p>
          <h2 className="mt-1 text-2xl font-semibold">Especiales</h2>
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}
        {!allInResult.ok ? <div className="mt-5"><SetupWarning error={allInResult.error} /></div> : null}

        {result.ok && allInResult.ok ? (
          <div className="mt-6 flex flex-col gap-8">
            <section className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">All-In</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Elegi el partido que triplica los puntos de tu pronostico.
                  </p>
                </div>
                <StatusBadge open={allInResult.value.canMove} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/80 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">Actual</p>
                  {allInResult.value.current ? (
                    <div className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
                      <p className="font-medium text-slate-950">{allInResult.value.current.label}</p>
                      <p>Partido: {allInResult.value.current.kickoffLabel}</p>
                      <p>Cierre: {allInResult.value.current.deadlineLabel}</p>
                      <p>
                        Estado:{" "}
                        <span className={allInResult.value.current.isLocked ? "text-red-700" : "text-emerald-700"}>
                          {allInResult.value.current.isLocked ? "Bloqueado" : "Movible"}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">Todavia no elegiste All-In.</p>
                  )}
                </div>
                <div className="rounded-lg border border-white/80 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">Elegir o mover</p>
                  <div className="mt-3">
                    <AllInPicker disabled={!allInResult.value.canMove} matches={allInResult.value.openMatches} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lideres de grupo</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Cierre: {result.value.worldCupDeadlineLabel ?? "sin fixture"}
                  </p>
                </div>
                <StatusBadge open={result.value.worldCupSpecialsOpen} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {result.value.groups.map((group) => (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={group.id}>
                    <p className="mb-3 font-semibold">Grupo {group.code}</p>
                    <SpecialForm
                      defaultTeamId={group.selectedTeamId}
                      disabled={!result.value.worldCupSpecialsOpen}
                      groupId={group.id}
                      options={group.teams}
                      submitLabel="Guardar"
                      type="group_winner"
                    />
                    <SpecialResult
                      points={group.points}
                      result={group.resultTeamName ?? "Pendiente"}
                      selected={group.selectedTeamName ?? "Sin cargar"}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Sorpresa negativa</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Cierre: {result.value.worldCupDeadlineLabel ?? "sin fixture"}
                  </p>
                </div>
                <StatusBadge open={result.value.worldCupSpecialsOpen} />
              </div>
              <div className="mt-4">
                <SpecialForm
                  defaultTeamId={result.value.negativeSurprise.selectedTeamId}
                  disabled={!result.value.worldCupSpecialsOpen}
                  options={result.value.negativeSurprise.options}
                  submitLabel="Guardar"
                  type="negative_surprise"
                />
                <SpecialResult
                  points={result.value.negativeSurprise.points}
                  result={result.value.negativeSurprise.resultLabel}
                  selected={result.value.negativeSurprise.selectedTeamName ?? "Sin cargar"}
                />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Podio</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Cierre: {result.value.knockoutDeadlineLabel ?? "sin fixture eliminatorio"}
                  </p>
                </div>
                <StatusBadge open={result.value.knockoutSpecialsOpen} />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Campeon</p>
                  <SpecialForm
                    defaultTeamId={result.value.podio.champion.selectedTeamId}
                    disabled={!result.value.knockoutSpecialsOpen}
                    options={result.value.podio.teams}
                    submitLabel="Guardar"
                    type="champion"
                  />
                  <SpecialResult
                    points={result.value.podio.champion.points}
                    result={result.value.podio.champion.resultTeamName ?? "Pendiente"}
                    selected={result.value.podio.champion.selectedTeamName ?? "Sin cargar"}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Subcampeon</p>
                  <SpecialForm
                    defaultTeamId={result.value.podio.runnerUp.selectedTeamId}
                    disabled={!result.value.knockoutSpecialsOpen}
                    options={result.value.podio.teams}
                    submitLabel="Guardar"
                    type="runner_up"
                  />
                  <SpecialResult
                    points={result.value.podio.runnerUp.points}
                    result={result.value.podio.runnerUp.resultTeamName ?? "Pendiente"}
                    selected={result.value.podio.runnerUp.selectedTeamName ?? "Sin cargar"}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Tercer puesto</p>
                  <SpecialForm
                    defaultTeamId={result.value.podio.thirdPlace.selectedTeamId}
                    disabled={!result.value.knockoutSpecialsOpen}
                    options={result.value.podio.teams}
                    submitLabel="Guardar"
                    type="third_place"
                  />
                  <SpecialResult
                    points={result.value.podio.thirdPlace.points}
                    result={result.value.podio.thirdPlace.resultTeamName ?? "Pendiente"}
                    selected={result.value.podio.thirdPlace.selectedTeamName ?? "Sin cargar"}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

async function getSpecialsSafely(username: string) {
  try {
    return { ok: true as const, value: await getSpecialsView(username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}

async function getAllInSafely(username: string) {
  try {
    return { ok: true as const, value: await getAllInView(username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}

function StatusBadge({ open }: { open: boolean }) {
  return (
    <span
      className={
        open
          ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
          : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
      }
    >
      {open ? "Abierto" : "Cerrado"}
    </span>
  );
}

function SpecialResult({
  points,
  result,
  selected,
}: {
  points: number | null;
  result: string;
  selected: string;
}) {
  return (
    <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <p>Elegido: {selected}</p>
      <p>Resultado: {result}</p>
      <p>Puntos: {points === null ? "Pendiente" : points}</p>
    </div>
  );
}
