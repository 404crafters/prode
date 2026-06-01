import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getAdminSummary } from "@/db/queries/admin";
import { getAdminUsers } from "@/db/queries/users";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { changeUserPasswordAction, saveUserAction, setUserActiveAction } from "./actions";
import { SyncButton } from "./sync-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const result = await getAdminSafely();
  const usersResult = await getUsersSafely();
  const env = getEnv();

  return (
    <AppShell>
      <section className="surface rounded-lg p-6">
        <div>
          <p className="eyebrow">Operacion</p>
          <h2 className="mt-1 text-3xl font-semibold">Admin</h2>
        </div>

        <div className="mt-5">
          <SyncButton />
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}
        {!usersResult.ok ? <div className="mt-5"><SetupWarning error={usersResult.error} /></div> : null}

        {result.ok && usersResult.ok ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(result.value.counts).map(([label, value]) => (
                <div className="metric-card rounded-lg p-4" key={label}>
                  <p className="text-sm text-slate-500">{getCountLabel(label)}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="soft-card rounded-lg p-5">
              <h3 className="text-lg font-semibold">Usuarios</h3>
              <form action={saveUserAction} className="mt-4 grid grid-cols-6 gap-2">
                <input
                  className="field-control text-sm"
                  name="username"
                  placeholder="usuario"
                  required
                />
                <input
                  className="field-control text-sm"
                  name="displayName"
                  placeholder="nombre visible"
                  required
                />
                <input
                  className="field-control text-sm"
                  minLength={4}
                  name="password"
                  placeholder="password"
                  required
                  type="password"
                />
                <select className="field-control text-sm" defaultValue="user" name="role">
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
                <select className="field-control text-sm" defaultValue="true" name="active">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
                <button className="primary-button h-10" type="submit">
                  Guardar
                </button>
              </form>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Password</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersResult.value.map((appUser) => (
                      <tr key={appUser.username}>
                        <td className="font-mono text-xs">{appUser.username}</td>
                        <td className="font-medium">{appUser.displayName}</td>
                        <td>{appUser.role === "admin" ? "Admin" : "Usuario"}</td>
                        <td>
                          <span className={appUser.active ? "pill pill-open" : "pill pill-closed"}>
                            {appUser.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <form action={changeUserPasswordAction} className="flex gap-2">
                            <input name="username" type="hidden" value={appUser.username} />
                            <input
                              className="field-control h-9 min-w-40 text-sm"
                              minLength={4}
                              name="password"
                              placeholder="nueva password"
                              required
                              type="password"
                            />
                            <button className="primary-button h-9 px-3" type="submit">
                              Cambiar
                            </button>
                          </form>
                        </td>
                        <td>
                          <form action={setUserActiveAction}>
                            <input name="username" type="hidden" value={appUser.username} />
                            <input name="active" type="hidden" value={appUser.active ? "false" : "true"} />
                            <button className="primary-button h-9 px-3" type="submit">
                              {appUser.active ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="soft-card rounded-lg p-5">
              <h3 className="text-lg font-semibold">Simulacion</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-slate-500">SIMULATION_MODE</p>
                  <p className="mt-1 font-semibold">{env.SIMULATION_MODE ? "true" : "false"}</p>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
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
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Inicio</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.value.recentSyncRuns.map((run) => (
                      <tr key={run.id}>
                        <td>{run.type}</td>
                        <td>{run.status}</td>
                        <td className="text-slate-600">{run.startedAt}</td>
                        <td className="text-slate-600">{run.errorMessage ?? "-"}</td>
                      </tr>
                    ))}
                    {result.value.recentSyncRuns.length === 0 ? (
                      <tr>
                        <td className="text-slate-500" colSpan={4}>
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

async function getUsersSafely() {
  try {
    return { ok: true as const, value: await getAdminUsers() };
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
    users: "Usuarios",
    predictions: "Pronosticos",
    specials: "Especiales",
    allIns: "All-In",
  };

  return labels[label] ?? label;
}
