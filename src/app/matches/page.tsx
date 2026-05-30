import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SetupWarning } from "@/components/ui/setup-warning";
import { getMatchList, type MatchListItem } from "@/db/queries/matches";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type MatchFilter = "all" | "open" | "closed" | "missing" | "predicted" | "scored";

type MatchSearchParams = {
  filter?: string;
  group?: string;
  team?: string;
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<MatchSearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const result = user
    ? await getMatchesSafely(user.username)
    : { ok: false as const, error: new Error("Sin sesion") };
  const visibleMatches = result.ok ? applyFilters(result.value, filter, params) : [];
  const groupMatches = visibleMatches.filter((match) => match.stage === "group");
  const knockoutMatches = visibleMatches.filter((match) => match.stage !== "group");
  const contextLabel = getContextLabel(result.ok ? result.value : [], params);

  return (
    <AppShell>
      <section className="surface rounded-lg p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Fixture</p>
            <h2 className="mt-1 text-3xl font-semibold">Partidos</h2>
            {contextLabel ? <p className="mt-2 text-sm text-slate-500">{contextLabel}</p> : null}
          </div>
          {result.ok ? <p className="pill bg-white text-slate-700">{visibleMatches.length} partidos</p> : null}
        </div>

        {!result.ok ? <div className="mt-5"><SetupWarning error={result.error} /></div> : null}

        {result.ok ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {filterLinks.map((item) => (
                <Link
                  className={
                    item.value === filter
                      ? "rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm"
                      : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
                  }
                  href={buildMatchesHref({ ...params, filter: item.value === "all" ? undefined : item.value })}
                  key={item.value}
                >
                  {item.label}
                </Link>
              ))}
              {params.group || params.team ? (
                <Link
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                  href={buildMatchesHref({ filter: params.filter })}
                >
                  Limpiar grupo/equipo
                </Link>
              ) : null}
            </div>

            <MatchSection title="Fase de grupos" matches={groupMatches} emptyLabel="No hay partidos de grupos para este filtro." />
            <KnockoutSection matches={knockoutMatches} />
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

const filterLinks: { value: MatchFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abiertos" },
  { value: "missing", label: "Me faltan" },
  { value: "predicted", label: "Cargados" },
  { value: "closed", label: "Cerrados" },
  { value: "scored", label: "Puntuados" },
];

const knockoutStageOrder = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
  "unknown",
];

function MatchSection({
  emptyLabel,
  matches,
  title,
}: {
  emptyLabel: string;
  matches: MatchListItem[];
  title: string;
}) {
  const groups = groupBy(matches, (match) => match.groupCode ?? "Sin grupo");

  return (
    <section>
      <h3 className="text-xl font-semibold">{title}</h3>
      {matches.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[...groups.entries()].map(([groupCode, groupMatches]) => (
            <div className="soft-card rounded-lg p-4" key={groupCode}>
              <Link
                className="inline-flex rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
                href={groupCode === "Sin grupo" ? "/matches" : `/matches?group=${groupCode}`}
              >
                {groupCode === "Sin grupo" ? groupCode : `Grupo ${groupCode}`}
              </Link>
              <div className="mt-3 flex flex-col gap-2">
                {groupMatches.map((match) => <MatchCard key={match.id} match={match} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{emptyLabel}</p>
      )}
    </section>
  );
}

function KnockoutSection({ matches }: { matches: MatchListItem[] }) {
  const byStage = groupBy(matches, (match) => match.stage);
  const orderedStages = knockoutStageOrder.filter((stage) => byStage.has(stage));

  return (
    <section>
      <h3 className="text-xl font-semibold">Fase eliminatoria</h3>
      {matches.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {orderedStages.map((stage) => (
            <div className="soft-card rounded-lg p-4" key={stage}>
              <p className="rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white">{getStageLabel(stage)}</p>
              <div className="mt-3 flex flex-col gap-2">
                {(byStage.get(stage) ?? []).map((match) => <MatchCard key={match.id} match={match} compact />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          No hay partidos eliminatorios para este filtro.
        </p>
      )}
    </section>
  );
}

function MatchCard({ compact = false, match }: { compact?: boolean; match: MatchListItem }) {
  return (
    <Link
      className="soft-card-link block rounded-md px-3 py-3"
      href={`/matches/${match.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-950">
              {match.homeTeamName ?? "TBD"} vs {match.awayTeamName ?? "TBD"}
            </p>
            {match.isAllIn ? (
              <span className="pill pill-all-in">
                All-In
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">{match.kickoffLabel}</p>
        </div>
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
      <div className={compact ? "mt-3 flex flex-col gap-2" : "mt-3 grid grid-cols-3 gap-2"}>
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
  );
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

function parseFilter(value: string | undefined): MatchFilter {
  return filterLinks.some((item) => item.value === value) ? (value as MatchFilter) : "all";
}

function applyFilters(matches: MatchListItem[], filter: MatchFilter, params: MatchSearchParams) {
  let filtered = matches;

  if (params.group) {
    filtered = filtered.filter((match) => match.groupCode === params.group);
  }

  if (params.team) {
    filtered = filtered.filter((match) => match.homeTeamId === params.team || match.awayTeamId === params.team);
  }

  if (filter === "open") {
    return filtered.filter((match) => match.isPredictionOpen);
  }

  if (filter === "closed") {
    return filtered.filter((match) => !match.isPredictionOpen);
  }

  if (filter === "missing") {
    return filtered.filter((match) => match.isPredictionOpen && !match.hasPrediction);
  }

  if (filter === "predicted") {
    return filtered.filter((match) => match.hasPrediction);
  }

  if (filter === "scored") {
    return filtered.filter((match) => match.points !== null);
  }

  return filtered;
}

function getContextLabel(matches: MatchListItem[], params: MatchSearchParams) {
  if (params.group) {
    return `Viendo partidos del grupo ${params.group}`;
  }

  if (params.team) {
    const teamMatch = matches.find((match) => match.homeTeamId === params.team || match.awayTeamId === params.team);
    const teamName = teamMatch?.homeTeamId === params.team ? teamMatch.homeTeamName : teamMatch?.awayTeamName;
    return teamName ? `Viendo partidos de ${teamName}` : "Viendo partidos del equipo seleccionado";
  }

  return null;
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

function buildMatchesHref(params: MatchSearchParams) {
  const query = new URLSearchParams();

  if (params.filter && params.filter !== "all") {
    query.set("filter", params.filter);
  }

  if (params.group) {
    query.set("group", params.group);
  }

  if (params.team) {
    query.set("team", params.team);
  }

  const queryString = query.toString();
  return queryString ? `/matches?${queryString}` : "/matches";
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return grouped;
}

async function getMatchesSafely(username: string) {
  try {
    return { ok: true as const, value: await getMatchList(username) };
  } catch (error) {
    return { ok: false as const, error };
  }
}
