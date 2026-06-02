import { AppShell } from "@/components/layout/app-shell";

const groupMatchRules = [
  {
    title: "Exacto",
    points: "5 pts",
    text: "Acertas el resultado con los goles correctos de los dos equipos.",
  },
  {
    title: "Full",
    points: "3 pts",
    text: "Acertas si gana el local, gana el visitante o empatan, aunque no sea el resultado exacto.",
  },
  {
    title: "Parcial",
    points: "1 pt",
    text: "El partido real o tu pronostico fue empate, pero no coincidieron.",
  },
  {
    title: "Incorrecto",
    points: "0 pts",
    text: "No coincide el ganador ni el empate.",
  },
];

const knockoutMatchRules = [
  {
    title: "Exacto",
    points: "5 pts",
    text: "Acertas los goles y tambien quien pasa de ronda.",
  },
  {
    title: "Ganador en eliminatorias",
    points: "3 pts",
    text: "Acertas quien pasa de ronda, aunque el resultado por goles no sea exacto.",
  },
  {
    title: "Parcial",
    points: "1 pt",
    text: "Acertas los goles, pero no el ganador que avanza.",
  },
  {
    title: "Incorrecto",
    points: "0 pts",
    text: "No coincide el ganador ni el resultado exacto.",
  },
];

const specialRules = [
  { label: "Lider de cada grupo", points: "3 pts", text: "Por cada grupo acertado." },
  { label: "Sorpresa negativa", points: "5 pts", text: "Si el elegido no clasifica." },
  { label: "Campeon", points: "15 pts", text: "Si acertaste el campeon." },
  { label: "Subcampeon", points: "8 pts", text: "Si acertaste el subcampeon." },
  { label: "Tercer puesto", points: "5 pts", text: "Si acertaste el tercer puesto." },
];

export default function RulesPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <section className="surface rounded-lg p-6">
          <p className="eyebrow">Reglas del juego</p>
          <h2 className="mt-1 text-3xl font-semibold">Reglamento</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            El ranking suma los puntos de tus pronosticos de partidos, tu All-In y tus pronosticos
            especiales. Solo cuentan los partidos terminados y los especiales que ya tengan resultado.
          </p>
        </section>

        <section className="surface rounded-lg p-6">
          <div>
            <p className="eyebrow">Partidos</p>
            <h3 className="mt-1 text-2xl font-semibold">Sistema de puntos</h3>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <MatchRuleGroup title="Fase de grupos" rules={groupMatchRules} />
            <MatchRuleGroup title="Eliminatorias" rules={knockoutMatchRules} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="surface rounded-lg p-6">
            <p className="eyebrow">Cierres</p>
            <h3 className="mt-1 text-2xl font-semibold">Cuando vence cada pronostico</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-slate-300">
              <RuleLine
                label="Partidos"
                text="Cada partido cierra al comienzo del dia del partido, en horario Argentina. Si un partido se juega el lunes, podes cargarlo hasta el domingo a las 23:59."
              />
              <RuleLine
                label="All-In"
                text="Podes elegir o mover tu All-In mientras el partido elegido siga abierto. Cuando cierra ese partido, el All-In queda bloqueado."
              />
              <RuleLine
                label="Lideres de grupo y sorpresa negativa"
                text="Cierran al comienzo del primer dia del Mundial."
              />
              <RuleLine
                label="Podio"
                text="Campeon, subcampeon y tercer puesto cierran al comienzo del primer dia de eliminatorias."
              />
            </div>
          </div>

          <div className="surface rounded-lg p-6">
            <p className="eyebrow">Bonus</p>
            <h3 className="mt-1 text-2xl font-semibold">All-In</h3>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              El All-In triplica los puntos que hagas en un partido. Si el pronostico base vale 5,
              suma 15. Si vale 3, suma 9. Si vale 1, suma 3. Si no sumas puntos en ese partido, el
              All-In tambien suma 0.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Solo puede haber un All-In activo por usuario. Se puede quitar o mover mientras el
              partido elegido todavia no haya cerrado.
            </p>
          </div>
        </section>

        <section className="surface rounded-lg p-6">
          <div>
            <p className="eyebrow">Especiales</p>
            <h3 className="mt-1 text-2xl font-semibold">Puntos especiales</h3>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {specialRules.map((rule) => (
              <div className="soft-card rounded-lg p-4" key={rule.label}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{rule.label}</p>
                  <span className="points-chip points-positive whitespace-nowrap">{rule.points}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{rule.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface rounded-lg p-6">
          <p className="eyebrow">Casos importantes</p>
          <h3 className="mt-1 text-2xl font-semibold">Eliminatorias, penales y visibilidad</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ImportantCase
              title="Penales en eliminatorias"
              text="Si pronosticas un empate en una eliminatoria, tambien tenes que elegir quien gana por penales. Los goles del pronostico son los del partido antes de la tanda; la tanda solo define quien avanza."
            />
            <ImportantCase
              title="Resultado exacto en eliminatorias"
              text="Para cobrar exacto en una eliminatoria necesitas acertar los goles y el ganador. Si acertaste los goles pero elegiste mal quien pasa, suma parcial."
            />
            <ImportantCase
              title="Pronosticos de otros usuarios"
              text="Los pronosticos de un partido se muestran cuando ese partido ya cerro. Antes del cierre, cada usuario ve solamente lo suyo."
            />
            <ImportantCase
              title="Partidos sin resultado"
              text="Un partido pendiente o sin ganador confirmado no suma puntos todavia. El ranking se actualiza cuando llegan los resultados."
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MatchRuleGroup({
  title,
  rules,
}: {
  title: string;
  rules: { title: string; points: string; text: string }[];
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-4">
      <h4 className="text-base font-semibold text-slate-100">{title}</h4>
      <div className="mt-4 grid gap-3">
        {rules.map((rule) => (
          <div className="soft-card rounded-lg p-4" key={rule.title}>
            <div className="flex items-start justify-between gap-3">
              <h5 className="text-base font-semibold text-slate-950">{rule.title}</h5>
              <span className="points-chip points-positive whitespace-nowrap">{rule.points}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{rule.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/55 p-4">
      <p className="font-semibold text-slate-100">{label}</p>
      <p className="mt-1 text-slate-300">{text}</p>
    </div>
  );
}

function ImportantCase({ title, text }: { title: string; text: string }) {
  return (
    <div className="soft-card rounded-lg p-4">
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}
