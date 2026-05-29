# Prode Mundial 2026 - Plan tecnico

## 1. Stack

Stack elegido:

- Next.js con App Router.
- TypeScript.
- Supabase Postgres como base de datos.
- Drizzle ORM para schema, queries y migraciones.
- Tailwind CSS.
- shadcn/ui para componentes.
- API-Football como proveedor externo de fixture, equipos, standings y resultados.
- Vercel para deploy.
- Vercel Cron para sincronizacion automatica.

Autenticacion:

- Sesion propia simple basada en cookie.
- Usuarios definidos en archivo de configuracion.
- Passwords en texto plano por decision de alcance.
- No se usa Supabase Auth.

Principio central:

- El frontend nunca consulta API-Football.
- API-Football solo se consume desde backend/server actions/API routes/jobs.
- La app lee y calcula desde Supabase Postgres.

## 2. Arquitectura

### 2.1 Capas

app:

- Rutas y pantallas de Next.js.
- Server components para lectura principal.
- Server actions/API routes para mutaciones.
- Validacion de acceso por cookie de sesion.

domain:

- Reglas puras de negocio.
- Calculo de cierre.
- Calculo de scoring.
- Estados derivados.
- Validaciones de pronosticos.

db:

- Schema Drizzle.
- Repositorios/queries.
- Migraciones.

integrations:

- Cliente API-Football.
- Mapeo de datos externos a modelo interno.
- Jobs de sincronizacion.

config:

- Usuarios.
- Constantes funcionales.
- Fechas clave configurables si hace falta.
- Equipos validos para sorpresa negativa.

### 2.2 Estructura de carpetas sugerida

```txt
src/
  app/
    (auth)/
      login/
    (app)/
      page.tsx
      matches/
      matches/[id]/
      groups/
      specials/
      ranking/
      admin/
    api/
      admin/sync/
      cron/sync/
  components/
    layout/
    matches/
    ranking/
    forms/
  config/
    users.ts
    game.ts
  db/
    schema.ts
    client.ts
    queries/
  domain/
    deadlines.ts
    scoring.ts
    predictions.ts
    ranking.ts
    standings.ts
  integrations/
    api-football/
      client.ts
      mapper.ts
      sync.ts
  lib/
    auth.ts
    date.ts
    env.ts
```

## 3. Modelo de datos

### 3.1 Entidades principales

users no vive en DB para el MVP. Vive en config estatica.

La DB guarda datos del Mundial, pronosticos y resultados calculables.

### 3.2 Tablas

#### teams

Representa una seleccion.

Campos:

- id: uuid interno.
- apiFootballTeamId: integer unico nullable.
- name: text.
- countryCode: text nullable.
- flagUrl: text nullable.
- createdAt.
- updatedAt.

Notas:

- `apiFootballTeamId` debe ser unico cuando exista.
- El nombre se actualiza por sync.

#### groups

Representa un grupo del Mundial.

Campos:

- id: uuid.
- code: text unico. Ejemplo: A, B, C.
- name: text. Ejemplo: Group A.
- createdAt.
- updatedAt.

#### group_teams

Relacion entre grupo y seleccion.

Campos:

- groupId.
- teamId.
- positionSeed: integer nullable.
- createdAt.

Clave unica:

- groupId + teamId.

#### matches

Representa un partido.

Campos:

- id: uuid.
- apiFootballFixtureId: integer unico.
- stage: enum.
- roundName: text nullable.
- groupId: uuid nullable.
- homeTeamId: uuid nullable.
- awayTeamId: uuid nullable.
- kickoffAt: timestamptz.
- venueName: text nullable.
- venueCity: text nullable.
- status: enum.
- homeGoals: integer nullable.
- awayGoals: integer nullable.
- winnerTeamId: uuid nullable.
- rawStatus: text nullable.
- rawData: jsonb nullable.
- createdAt.
- updatedAt.

stage enum:

- group
- round_of_32
- round_of_16
- quarter_final
- semi_final
- third_place
- final
- unknown

status enum:

- scheduled
- in_progress
- finished
- postponed
- cancelled
- unknown

Notas:

- `homeGoals` y `awayGoals` no incluyen penales.
- En eliminatorias, `winnerTeamId` representa ganador final, incluyendo penales.
- Si un partido eliminatorio esta finalizado y `winnerTeamId` es null, no se debe puntuar.

#### standings

Snapshot actual de posiciones de grupo.

Campos:

- id: uuid.
- groupId.
- teamId.
- rank: integer.
- points: integer nullable.
- played: integer nullable.
- won: integer nullable.
- drawn: integer nullable.
- lost: integer nullable.
- goalsFor: integer nullable.
- goalsAgainst: integer nullable.
- goalDifference: integer nullable.
- rawData: jsonb nullable.
- syncedAt: timestamptz.

Clave unica:

- groupId + teamId.

#### match_predictions

Pronostico de un usuario para un partido.

Campos:

- id: uuid.
- username: text.
- matchId: uuid.
- homeGoals: integer.
- awayGoals: integer.
- predictedWinnerTeamId: uuid nullable.
- createdAt.
- updatedAt.

Clave unica:

- username + matchId.

Reglas:

- Para fase de grupos, `predictedWinnerTeamId` debe ser null.
- Para eliminatoria con goles distintos, `predictedWinnerTeamId` puede ser null y se infiere.
- Para eliminatoria con goles iguales, `predictedWinnerTeamId` es obligatorio.

#### user_all_ins

Partido All-In elegido por usuario.

Campos:

- username: text clave primaria.
- matchId: uuid.
- createdAt.
- updatedAt.

Reglas:

- Solo puede apuntar a un partido abierto segun deadline.
- Puede cambiarse si el partido actual y el nuevo partido siguen abiertos.

#### special_predictions

Pronosticos especiales de usuario.

Campos:

- id: uuid.
- username: text.
- type: enum.
- groupId: uuid nullable.
- teamId: uuid.
- createdAt.
- updatedAt.

type enum:

- group_winner
- negative_surprise
- champion
- runner_up
- third_place

Claves unicas:

- Para group_winner: username + type + groupId.
- Para otros tipos: username + type.

Reglas:

- `groupId` solo aplica a `group_winner`.
- `negative_surprise` solo acepta equipos configurados.

#### sync_runs

Registro de sincronizaciones.

Campos:

- id: uuid.
- type: enum.
- status: enum.
- startedAt.
- finishedAt nullable.
- errorMessage nullable.
- metadata: jsonb nullable.

type enum:

- full
- fixtures
- teams
- standings
- results

status enum:

- running
- success
- failed

### 3.3 Tablas no necesarias al inicio

No se crean en MVP:

- users.
- audit_logs.
- password_resets.
- notifications.
- prizes.
- teams/departments.

## 4. Reglas de dominio

### 4.1 Fechas y timezone

Todas las reglas usan America/Argentina/Buenos_Aires.

Funciones necesarias:

- `getArgentinaDate(now)`
- `getDeadlineForMatch(match)`
- `isMatchPredictionOpen(match, now)`
- `isMatchPredictionsVisible(match, now)`
- `getWorldCupStartDeadline()`
- `getKnockoutStartDeadline()`
- `isSpecialPredictionOpen(type, now)`

Regla de partido:

- Deadline = inicio del dia local argentino del kickoff.
- Abierto si `now < deadline`.
- Visible para todos si `now >= deadline`.

### 4.2 Inicio del Mundial

Para lideres de grupo y sorpresa negativa:

- Deadline = inicio del dia local argentino del primer partido del Mundial.
- Puede derivarse desde `min(matches.kickoffAt)`.
- Si no hay fixture cargado, admin debe ver advertencia.

### 4.3 Inicio de eliminatorias

Para campeon, subcampeon y tercer puesto:

- Deadline = inicio del dia local argentino del primer partido cuyo stage no sea `group`.
- Puede derivarse desde `min(matches.kickoffAt where stage != group)`.
- Si no hay fixture eliminatorio cargado, admin debe ver advertencia.

## 5. Motor de scoring

El scoring debe implementarse como funciones puras y testeables.

### 5.1 Tipos sugeridos

```ts
type MatchStage = "group" | "knockout";

type MatchResult = {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId: string | null;
  stage: MatchStage;
};

type MatchPrediction = {
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId: string | null;
};
```

### 5.2 Funciones

- `scoreGroupMatchPrediction(result, prediction): 0 | 1 | 3 | 5`
- `scoreKnockoutMatchPrediction(result, prediction): 0 | 1 | 3 | 5`
- `scoreMatchPrediction(result, prediction): 0 | 1 | 3 | 5`
- `applyAllIn(basePoints, isAllIn): number`
- `scoreSpecialPrediction(...)`
- `calculateUserRanking(...)`

### 5.3 Fase de grupos

Orden:

1. Si no hay pronostico, 0.
2. Si goles exactos, 5.
3. Si signo exacto, 3.
4. Si el pronostico o el resultado real es empate, 1.
5. Caso contrario, 0.

La regla 4 cubre:

- Ganador pronosticado y empate real.
- Perdedor pronosticado y empate real.
- Empate pronosticado y ganador real.
- Empate pronosticado y perdedor real.

### 5.4 Eliminatorias

Orden:

1. Si no hay pronostico, 0.
2. Si el resultado no tiene ganador final, no puntuar todavia.
3. Si goles exactos y ganador final exacto, 5.
4. Si ganador final exacto, 3.
5. Si goles exactos y ganador final incorrecto, 1.
6. Caso contrario, 0.

## 6. Sincronizacion API-Football

### 6.1 Variables de entorno

Variables esperadas:

- `API_FOOTBALL_KEY`
- `API_FOOTBALL_BASE_URL`
- `DATABASE_URL`
- `SESSION_SECRET`
- `CRON_SECRET`
- `SIMULATION_MODE`
- `SIMULATION_NOW`

### 6.2 Endpoints internos

Admin manual:

- `POST /api/admin/sync`
- Requiere usuario admin.

Cron:

- `GET /api/cron/sync`
- Requiere `CRON_SECRET`.

### 6.3 Estrategia de sync

El sync debe ser idempotente.

Pasos:

1. Crear `sync_run` running.
2. Consultar fixtures del Mundial 2026.
3. Upsert teams.
4. Upsert groups.
5. Upsert group_teams.
6. Upsert matches.
7. Consultar standings.
8. Upsert standings.
9. Marcar `sync_run` success.

Si falla:

1. Guardar error en `sync_runs`.
2. No borrar datos previos.
3. La app sigue funcionando con ultimo estado conocido.

### 6.4 Limite de requests

Como el free tier es limitado, la app debe:

- Usar cron moderado.
- No hacer polling desde frontend.
- Permitir sync manual admin.
- Guardar `rawData` para diagnostico.
- Evitar llamadas duplicadas dentro de la misma ejecucion.

## 7. Pantallas y rutas

### 7.1 Login

Ruta:

- `/login`

Funciones:

- Login con username/password.
- Crear cookie de sesion.
- Redirigir a home.

### 7.2 Home

Ruta:

- `/`

Componentes:

- Puntaje propio.
- Ranking resumido.
- Proximo cierre.
- Faltantes proximos.
- Partidos de hoy.

### 7.3 Calendario

Ruta:

- `/matches`

Funciones:

- Listar partidos.
- Filtros por fase/grupo.
- Estado de carga por partido.
- Acceso al detalle.

### 7.4 Detalle de partido

Ruta:

- `/matches/[id]`

Antes del cierre:

- Formulario de pronostico propio.
- Accion para marcar como All-In.
- Predicciones del resto ocultas.

Despues del cierre:

- Pronostico propio bloqueado.
- Tabla de pronosticos de todos.
- Resultado y puntos si existen.

### 7.5 Grupos

Ruta:

- `/groups`

Funciones:

- Ver grupos.
- Ver standings.
- Elegir lideres de grupo si esta abierto.

### 7.6 Especiales

Ruta:

- `/specials`

Funciones:

- Lideres de grupo.
- Sorpresa negativa.
- Campeon.
- Subcampeon.
- Tercer puesto.
- Estado de cierre por tipo.

### 7.7 Ranking

Ruta:

- `/ranking`

Funciones:

- Ranking completo.
- Desglose resumido.
- Link a detalle de usuario.

### 7.8 Admin

Ruta:

- `/admin`

Funciones:

- Sync manual.
- Ultimo sync.
- Errores recientes.
- Conteos sincronizados.

## 8. Validaciones

### 8.1 Pronostico de partido

Validaciones:

- Usuario autenticado.
- Partido existe.
- Partido tiene equipos definidos.
- Partido sigue abierto.
- Goles son enteros >= 0.
- En fase de grupos no se acepta ganador final separado.
- En eliminatoria con empate pronosticado se requiere ganador final.
- En eliminatoria el ganador final debe ser home o away.

### 8.2 All-In

Validaciones:

- Usuario autenticado.
- Partido destino existe.
- Partido destino esta abierto.
- Si ya existe All-In actual, el partido actual debe seguir abierto.

### 8.3 Especiales

Validaciones:

- Usuario autenticado.
- Tipo valido.
- Deadline abierto.
- Equipo existe.
- Para lider de grupo, equipo pertenece al grupo.
- Para sorpresa negativa, equipo esta en lista permitida.

## 9. Ranking y consultas

Para el MVP, el ranking puede calcularse bajo demanda desde DB.

Motivo:

- Solo hay hasta 15 usuarios.
- Volumen bajo: 104 partidos + pocos especiales.
- Evita mantener tablas materializadas prematuramente.

Si luego hace falta optimizar:

- Crear tabla `user_scores`.
- Recalcular despues de cada sync.

Consultas necesarias:

- Todos los usuarios de config.
- Todos los partidos finalizados.
- Pronosticos por usuario.
- All-In por usuario.
- Especiales por usuario.
- Standings finales de grupo.
- Resultado final del torneo.

## 10. Plan de implementacion

### Fase 1 - Bootstrap

Objetivo:

- Tener app Next.js deployable y conectada a Supabase.

Tareas:

- Crear proyecto Next.js.
- Configurar TypeScript, Tailwind y shadcn/ui.
- Configurar Drizzle.
- Crear variables de entorno.
- Crear layout base.
- Crear healthcheck simple.

### Fase 2 - DB, dominio y simulacion

Objetivo:

- Tener schema, reglas testeables y capacidad de probar momentos distintos del Mundial en dev.

Tareas:

- Crear schema Drizzle.
- Crear migracion inicial.
- Implementar helpers de fecha Argentina.
- Implementar helper unico de reloj.
- Implementar motor de scoring.
- Implementar validaciones de pronosticos.
- Agregar tests unitarios de scoring y deadlines.
- Agregar simulation mode por variables de entorno.
- Agregar seeds versionados para escenarios de Mundial.

### Fase 3 - Auth simple

Objetivo:

- Bloquear toda la app detras de login.

Tareas:

- Crear config de usuarios.
- Implementar login.
- Implementar cookie de sesion.
- Implementar logout.
- Crear guard de rutas.
- Implementar rol admin.

### Fase 4 - Sync API-Football

Objetivo:

- Poblar DB con datos reales.

Tareas:

- Crear cliente API-Football.
- Crear mapper.
- Crear sync idempotente.
- Crear `sync_runs`.
- Crear ruta admin sync.
- Crear ruta cron sync.
- Crear pantalla admin minima.

### Fase 5 - Fixture y grupos

Objetivo:

- Navegar datos del Mundial.

Tareas:

- Pantalla calendario.
- Detalle de partido sin formulario.
- Pantalla grupos.
- Mostrar standings.
- Clasificar partidos por fase.

### Fase 6 - Pronosticos

Objetivo:

- Cargar predicciones de partidos.

Tareas:

- Formulario de pronostico.
- Server action de upsert.
- Reglas de cierre.
- Ocultamiento/visibilidad de predicciones.
- Tabla de predicciones cerradas.

### Fase 7 - All-In y especiales

Objetivo:

- Completar todos los tipos de pronosticos.

Tareas:

- Selector All-In.
- Formulario de lideres de grupo.
- Formulario de sorpresa negativa.
- Formulario de campeon/subcampeon/tercer puesto.
- Validaciones de deadline.

### Fase 8 - Ranking y home

Objetivo:

- Hacer visible la competencia.

Tareas:

- Implementar calculo de ranking.
- Pantalla ranking.
- Detalle resumido de usuario.
- Home con puntaje propio.
- Home con proximo cierre.
- Home con faltantes proximos.
- Home con partidos de hoy.

### Fase 9 - QA funcional

Objetivo:

- Validar reglas criticas.

Tareas:

- Tests del scoring.
- Tests de deadlines.
- Tests de validaciones.
- Test manual de flujo completo.
- Verificacion en Vercel preview.

## 11. Orden recomendado de commits

1. Bootstrap Next.js + Tailwind.
2. Drizzle schema + migracion inicial.
3. Dominio: fechas, deadlines y scoring.
4. Auth simple.
5. Sync API-Football.
6. Pantallas de lectura: home basica, calendario, grupos.
7. Pronosticos de partidos.
8. All-In.
9. Especiales.
10. Ranking.
11. Admin y cron.
12. QA y pulido.

## 12. Riesgos

API-Football no trae un dato esperado:

- Mitigacion: guardar rawData y mostrar diagnostico admin.

Fixture con equipos TBD:

- Mitigacion: no permitir pronosticar hasta que ambos equipos existan.

Cambios de fecha:

- Mitigacion: recalcular deadlines desde fecha sincronizada.

Timezone:

- Mitigacion: encapsular toda logica de cierre en `domain/deadlines.ts` y testearla.

Passwords planas:

- Riesgo aceptado por alcance.
- Mitigacion minima: no reutilizar contraseñas reales.

Ranking calculado bajo demanda:

- Riesgo bajo por volumen.
- Mitigacion futura: materializar puntajes si hiciera falta.

Simulation mode activo por error:

- Riesgo: usar reloj falso o seeds fake en ambiente productivo.
- Mitigacion: bloquear `SIMULATION_MODE=true` cuando `NODE_ENV=production`, salvo override explicito que no deberia usarse en Vercel production.

## 13. Definicion de listo tecnica

El MVP esta listo cuando:

- Todos los usuarios de config pueden iniciar sesion.
- El admin puede sincronizar datos.
- El fixture se ve desde la DB.
- Se pueden cargar pronosticos abiertos.
- Se bloquean pronosticos cerrados.
- Se ven predicciones del resto solo cuando corresponde.
- El All-In respeta cierres.
- Los especiales respetan cierres.
- El ranking calcula correctamente partidos, All-In y especiales.
- La home muestra faltantes y proximo cierre.
- Hay tests unitarios para scoring y deadlines.

## 14. Simulation mode

Simulation mode permite probar la app antes del Mundial con datos controlados y un reloj configurable.

No reemplaza la sincronizacion real con API-Football. Es una herramienta de desarrollo y staging para validar reglas, UI, cierres, visibilidad, All-In, especiales y ranking.

### 14.1 Alcance

Incluido:

- Setear fecha y hora actual por variables de entorno.
- Cargar seeds versionados desde comandos.
- Simular distintos momentos del Mundial.
- Probar la app completa sin depender de API-Football.

No incluido:

- Mockoon.
- Mock HTTP de API-Football.
- Simulador visual complejo.
- Edicion de resultados desde UI.

### 14.2 Variables de entorno

`SIMULATION_MODE`:

- `false` por defecto.
- Si es `true`, la app usa reloj controlado.
- Solo permitido en desarrollo/staging.

`SIMULATION_NOW`:

- Fecha/hora ISO usada como "ahora" cuando `SIMULATION_MODE=true`.
- Debe incluir timezone o ser UTC explicito.
- Ejemplo: `2026-06-10T12:00:00-03:00`.

Ejemplo:

```env
SIMULATION_MODE=true
SIMULATION_NOW=2026-06-15T10:00:00-03:00
```

### 14.3 Helper de reloj

Toda la app debe obtener la fecha actual desde un unico helper.

Archivo sugerido:

```txt
src/lib/clock.ts
```

API sugerida:

```ts
export function getNow(): Date
```

Reglas:

- Si `SIMULATION_MODE=false`, devuelve fecha real.
- Si `SIMULATION_MODE=true`, devuelve `SIMULATION_NOW`.
- Si `SIMULATION_MODE=true` y falta `SIMULATION_NOW`, debe fallar de forma explicita.
- Ninguna regla de dominio debe usar `new Date()` directamente.

### 14.4 Seeds versionados

Los seeds deben ser deterministas y vivir en el repo.

Carpeta sugerida:

```txt
src/db/seeds/
  scenarios/
    pre-worldcup.ts
    group-stage-day-1.ts
    group-stage-mid.ts
    group-stage-finished.ts
    knockouts-start.ts
    knockouts-mid.ts
    finished-worldcup.ts
```

Cada seed debe poder:

- Limpiar datos de torneo y pronosticos.
- Insertar equipos.
- Insertar grupos.
- Insertar partidos.
- Insertar standings cuando corresponda.
- Insertar resultados cuando corresponda.
- Insertar pronosticos de usuarios de prueba cuando sirva para validar ranking.
- Insertar All-In y especiales de usuarios de prueba cuando sirva para validar scoring.

Los usuarios siguen viniendo desde config, no desde DB.

### 14.5 Escenarios minimos

`pre-worldcup`:

- Fixture completo o representativo.
- Sin resultados.
- Todos los especiales abiertos.
- Todos los partidos abiertos.

`group-stage-day-1`:

- Primer dia del Mundial.
- Lideres de grupo y sorpresa negativa cerrados.
- Partidos del dia visibles.
- Partidos futuros abiertos.

`group-stage-mid`:

- Algunos partidos finalizados.
- Algunos partidos cerrados sin resultado.
- Algunos partidos futuros abiertos.
- Ranking parcial visible.

`group-stage-finished`:

- Todos los grupos finalizados.
- Standings completos.
- Lideres y sorpresa negativa puntuables.
- Podio todavia abierto si la fecha simulada es anterior al inicio de eliminatorias.

`knockouts-start`:

- Inicio de eliminatorias.
- Campeon, subcampeon y tercer puesto cerrados.
- Partidos eliminatorios creados.
- Algunos equipos pueden venir de clasificacion real/fake.

`knockouts-mid`:

- Algunos partidos eliminatorios finalizados.
- Debe incluir al menos un partido definido por penales.
- Debe incluir casos de score empatado con ganador final.

`finished-worldcup`:

- Mundial completo.
- Campeon, subcampeon y tercer puesto definidos.
- Ranking final calculable.

### 14.6 Comandos sugeridos

Comandos npm:

```json
{
  "scripts": {
    "db:seed": "tsx src/db/seeds/run.ts",
    "db:seed:pre-worldcup": "tsx src/db/seeds/run.ts pre-worldcup",
    "db:seed:group-stage-day-1": "tsx src/db/seeds/run.ts group-stage-day-1",
    "db:seed:group-stage-mid": "tsx src/db/seeds/run.ts group-stage-mid",
    "db:seed:group-stage-finished": "tsx src/db/seeds/run.ts group-stage-finished",
    "db:seed:knockouts-start": "tsx src/db/seeds/run.ts knockouts-start",
    "db:seed:knockouts-mid": "tsx src/db/seeds/run.ts knockouts-mid",
    "db:seed:finished-worldcup": "tsx src/db/seeds/run.ts finished-worldcup"
  }
}
```

### 14.7 Seguridad

Reglas:

- Los seeds no deben ejecutarse automaticamente en produccion.
- El runner de seeds debe rechazar ejecucion si `NODE_ENV=production`, salvo variable de override explicita para desarrollo local contra una DB descartable.
- La UI debe mostrar un indicador visible cuando `SIMULATION_MODE=true`.
- La pantalla admin debe mostrar el `SIMULATION_NOW` activo.

### 14.8 Tests asociados

Tests necesarios:

- `getNow()` devuelve fecha real en modo normal.
- `getNow()` devuelve `SIMULATION_NOW` en simulation mode.
- Falla si simulation mode esta activo sin fecha.
- Deadlines usan `getNow()` o reciben `now` inyectado.
- No hay uso directo de `new Date()` en modulos de dominio, salvo helpers de clock/date.
