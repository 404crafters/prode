# Prode Mundial 2026 - Live backlog

Este archivo es el backlog vivo del proyecto. Mantenerlo actualizado cuando se agregan, completan o cambian tareas.

## Estado actual

Ultima actualizacion: 2026-05-30

## Hecho

- Definicion funcional del MVP en `docs/functional-spec.md`.
- Plan tecnico en `docs/technical-plan.md`.
- Backlog inicial por epicas en `docs/backlog.md`.
- Bootstrap Next.js con TypeScript, App Router y Tailwind.
- Supabase Postgres configurado via `DATABASE_URL`.
- Drizzle configurado con migracion inicial.
- Schema base:
  - equipos
  - grupos
  - equipos por grupo
  - partidos
  - standings
  - pronosticos de partido
  - All-In
  - pronosticos especiales
  - sync runs
- Login simple con usuarios definidos en `src/config/users.ts`.
- Middleware de proteccion de rutas.
- Logout.
- Reloj controlado por `SIMULATION_MODE` y `SIMULATION_NOW`.
- Deadlines por dia Argentina.
- Tests de deadlines.
- Scoring de partidos:
  - fase de grupos
  - eliminatorias
  - All-In
  - breakdown de acierto
- Tests de scoring.
- Dominio de clasificados y podio.
- Tests de clasificacion y podio.
- Seeds de simulacion:
  - `pre-worldcup`
  - `group-stage-day-1`
  - `group-stage-mid`
  - `group-stage-finished`
  - `knockouts-start`
  - `knockouts-mid`
  - `finished-worldcup`
- Pantalla home con:
  - resumen de datos
  - proximo cierre
  - faltantes proximos
  - links directos a faltantes
  - partidos de hoy
  - top ranking
  - ranking clickeable por usuario
- Pantalla `/matches` con:
  - fixture
  - filtros
  - filtro por grupo via query string
  - filtro por equipo via query string
  - separacion visual entre fase de grupos y eliminatorias
  - tarjetas por grupo e instancia eliminatoria
  - estado de carga
  - mi pronostico
  - All-In
  - puntos y tipo de acierto
- Pantalla `/matches/[id]` con:
  - carga de pronostico
  - bloqueo por deadline
  - visibilidad de pronosticos del resto al cerrar
  - All-In
  - puntos visibles al cerrar
  - UX de eliminatorias con selector de ganador por penales solo cuando el score pronosticado es empate
  - pronostico propio bloqueado con puntos, ganador por penales y estado cerrado sin resultado
- Pantalla `/all-in` redirige a `/specials`.
- Pantalla `/groups` con grupos y posiciones.
- Pantalla `/groups` con links desde grupo a sus partidos.
- Pantalla `/groups` con links desde equipo a sus partidos.
- Pantalla `/specials` con:
  - lideres de grupo
  - sorpresa negativa
  - campeon
  - subcampeon
  - tercer puesto
- Pantalla `/specials` con UX de carga:
  - estado abierto/cerrado por seccion
  - seleccion actual
  - resultado real cuando existe
  - puntos obtenidos cuando ya son puntuables
  - All-In integrado en la misma pantalla
  - All-In con selector agrupado por fase
  - All-In permite elegir slots futuros de eliminatorias aunque todavia sean TBD
  - All-In se puede quitar mientras no este bloqueado
- Pantalla `/ranking` con:
  - posiciones
  - puntos por partidos
  - bonus All-In
  - puntos especiales
  - resumen de exactos/full/parciales
- Pantalla `/ranking/[username]` con:
  - detalle de puntos por partido
  - detalle de especiales
  - labels de lider por grupo
  - resumen de exactos/full/parciales
- Pantalla `/admin` con:
  - diagnostico
  - boton de sync
  - `SIMULATION_MODE`
  - `SIMULATION_NOW`
  - comandos utiles de seeds
- Cliente API-Football.
- Mapper API-Football.
- Sync idempotente API-Football.
- Endpoint cron `/api/cron/sync`.
- Script `npm run sync:api-football`.
- Criterio de sorpresa negativa protegido contra standings incompletos.
- Test de standings completos para clasificados/sorpresa negativa.
- Limpieza de home:
  - eliminada seccion "Pantallas"
  - eliminado bloque All-In
  - "Standings" traducido a "Posiciones"
- App renombrada a "Prode de 404".
- Pulido visual general con superficies blancas translúcidas, sombras suaves y tarjetas mas escaneables.
- Rediseño visual general:
  - fondo global mas trabajado
  - header con marca 404
  - superficies, metric cards, badges, botones, inputs y tablas consistentes
  - home con ranking en tarjetas
  - fixture con tarjetas mas destacadas por grupo/instancia
  - formularios de login, pronosticos, All-In y especiales alineados al nuevo estilo
- Dark mode fijo aplicado a todo el sitio:
  - fondo, superficies y tarjetas oscuras
  - textos, bordes, tablas e inputs ajustados para contraste
  - overrides globales para evitar restos de light mode en utilities existentes
- Seeds ajustados:
  - `España` con ñ
  - primera fase eliminatoria etiquetada como `16avos`
  - `Octavos` para `round_of_16`
  - fechas de eliminatorias ordenadas despues de fase de grupos
- Verificaciones actuales:
  - `npm test`
  - `npm run lint`
  - `npm run build`

## Bloqueado / externo

- Sync real con API-Football 2026: la API respondio que el plan free no tiene acceso a `season=2026`.
- Decidir proveedor/API final o plan de API-Football para Mundial 2026.

## Proximo

1. Deploy:
   - Preparar variables para Vercel.
   - Agregar `vercel.json` con cron si corresponde.
   - Documentar setup de Supabase dev/prod.

## Pendiente post-MVP / hardening

- Validar visualmente selecciones repetidas en podio si se decide restringirlas. Por ahora se permiten.
- Evolucionar la vista eliminatoria a un bracket real cuando el fixture final tenga cruces completos y posiciones definitivas.
- Agregar tests de validaciones de especiales.
- Agregar tests de ranking con All-In y especiales.
- Agregar tests de dashboard/faltantes.
- Mejorar errores de sync/API cuando se defina proveedor final.

## Comandos utiles

```bash
npm test
npm run lint
npm run build
npm run db:migrate
npm run db:seed:group-stage-mid
npm run dev -- --port 3001
```
