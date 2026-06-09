import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TeamLabel } from "@/components/team/team-label";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getMatchList, type MatchListItem } from "@/db/queries/matches";
import { getCurrentUser } from "@/lib/auth";
import { getNow } from "@/lib/clock";

export const dynamic = "force-dynamic";

type AgendaFilter = "upcoming" | "all" | "open" | "closed" | "missing" | "predicted" | "scored";

type AgendaSearchParams = {
  filter?: string;
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<AgendaSearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const result = user
    ? await getAgendaSafely(user.username)
    : { ok: false as const, error: new Error("Sin sesion") };
  const now = getNow();
  const visibleMatches = result.ok ? applyFilters(result.value, filter, now) : [];
  const days = result.ok ? groupByDay(visibleMatches) : [];

  return (
    <AppShell>
      <section className="surface rounded-lg p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Calendario</p>
            <h2 className="mt-1 text-3xl font-semibold">Agenda</h2>
          </div>
          {result.ok ? <p className="pill bg-white text-slate-700">{visibleMatches.length} partidos</p> : null}
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {filterLinks.map((item) => (
                <Link
                  className={
                    item.value === filter
                      ? "rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm"
                      : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
                  }
                  href={buildAgendaHref(item.value)}
                  key={item.value}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {days.length > 0 ? days.map(([dayKey, matches]) => (
              <section className="soft-card rounded-lg p-4" key={dayKey}>
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <h3 className="text-lg font-semibold capitalize">{formatDay(matches[0].kickoffAt)}</h3>
                  <span className="pill bg-slate-950 text-white">{matches.length} partidos</span>
                </div>
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  {matches.map((match) => (
                    <Link
                      className="soft-card-link rounded-md px-3 py-3"
                      href={`/fixture/${match.id}`}
                      key={match.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                              <TeamLabel flagUrl={match.homeTeamFlagUrl} name={match.homeTeamName ?? "TBD"} />
                              <span className="text-slate-500">vs</span>
                              <TeamLabel flagUrl={match.awayTeamFlagUrl} name={match.awayTeamName ?? "TBD"} />
                            </span>
                            {match.isAllIn ? (
                              <span className="pill pill-all-in">
                                All-In
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {match.stage === "group" && match.groupCode ? `Grupo ${match.groupCode}` : getStageLabel(match.stage)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-md bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950">
                            {formatTime(match.kickoffAt)}
                          </span>
                          <span
                            className={
                              match.isPredictionOpen
                                ? "pill pill-open"
                                : "pill pill-closed"
                            }
                          >
                            {match.isPredictionOpen ? "Abierta" : "Cerrada"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <MatchMetric label="Pronostico" value={match.predictionLabel ?? "-"} />
                        <MatchMetric
                          label="Resultado"
                          value={match.homeGoals === null || match.awayGoals === null ? "-" : `${match.homeGoals} - ${match.awayGoals}`}
                        />
                        <div className="match-metric">
                          <span className="match-metric-label">Puntos</span>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <PointsChip points={match.points} />
                            {match.scoreLabel ? <ScoreBadge label={match.scoreLabel} /> : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )) : (
              <p className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200">
                No hay partidos para este filtro.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

const filterLinks: { value: AgendaFilter; label: string }[] = [
  { value: "upcoming", label: "Proximos" },
  { value: "missing", label: "Me faltan" },
  { value: "open", label: "Abiertos" },
  { value: "predicted", label: "Cargados" },
  { value: "closed", label: "Cerrados" },
  { value: "scored", label: "Puntuados" },
  { value: "all", label: "Todos" },
];

async function getAgendaSafely(username: string) {
  try {
    return { ok: true as const, value: await getMatchList(username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}

function groupByDay(matches: MatchListItem[]) {
  const groups = new Map<string, MatchListItem[]>();

  for (const match of matches) {
    const key = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
    }).format(match.kickoffAt);
    groups.set(key, [...(groups.get(key) ?? []), match]);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function parseFilter(value: string | undefined): AgendaFilter {
  return filterLinks.some((item) => item.value === value) ? (value as AgendaFilter) : "upcoming";
}

function applyFilters(matches: MatchListItem[], filter: AgendaFilter, now: Date) {
  if (filter === "upcoming") {
    return matches.filter((match) => isUpcoming(match, now));
  }

  if (filter === "missing") {
    return matches.filter((match) => isUpcoming(match, now) && match.isPredictionOpen && !match.hasPrediction);
  }

  if (filter === "open") {
    return matches.filter((match) => match.isPredictionOpen);
  }

  if (filter === "closed") {
    return matches.filter((match) => !match.isPredictionOpen);
  }

  if (filter === "predicted") {
    return matches.filter((match) => match.hasPrediction);
  }

  if (filter === "scored") {
    return matches.filter((match) => match.points !== null);
  }

  return matches;
}

function isUpcoming(match: MatchListItem, now: Date) {
  return match.status === "in_progress" || match.kickoffAt.getTime() >= now.getTime();
}

function buildAgendaHref(filter: AgendaFilter) {
  return filter === "upcoming" ? "/agenda" : `/agenda?filter=${filter}`;
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

function getStageLabel(stage: string) {
  const labels: Record<string, string> = {
    round_of_32: "16avos",
    round_of_16: "Octavos",
    quarter_final: "Cuartos",
    semi_final: "Semifinales",
    third_place: "Tercer puesto",
    final: "Final",
    unknown: "Sin instancia",
  };

  return labels[stage] ?? stage;
}

function MatchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="match-metric">
      <span className="match-metric-label">{label}</span>
      <span className="match-metric-value">{value}</span>
    </div>
  );
}

function PointsChip({ points }: { points: number | null }) {
  return (
    <span
      className={
        points === null
          ? "points-chip points-pending"
          : points > 0
            ? "points-chip points-positive"
            : "points-chip points-zero"
      }
    >
      {points === null ? "-" : points}
    </span>
  );
}

function ScoreBadge({ label }: { label: string }) {
  return <span className={`score-badge ${getScoreBadgeClass(label)}`}>{getScoreBadgeLabel(label)}</span>;
}

function getScoreBadgeClass(label: string) {
  if (label === "Exacto") {
    return "score-exact";
  }

  if (label === "Signo" || label === "Ganador") {
    return "score-full";
  }

  if (label === "Parcial") {
    return "score-partial";
  }

  if (label === "Incorrecto" || label === "Sin pronostico") {
    return "score-miss";
  }

  return "score-pending";
}

function getScoreBadgeLabel(label: string) {
  return label === "Sin pronostico" ? "-" : label;
}
