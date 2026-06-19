# Prode Mundial 2026 - Live backlog

Este archivo es el backlog vivo del proyecto. Mantenerlo actualizado cuando se agregan, completan o cambian tareas.

## Estado actual

Ultima actualizacion: 2026-06-19

## Hecho

- Header actualizado con el logo oficial de 404 desde `public/logo_pill_white.png`.
- Fix sync resultados por partido (Mundial 2026): la lista
  `/competitions/WC/matches` llega rezagada dias (devuelve `TIMED` con score
  `null` mucho despues del kickoff), mientras que el endpoint por-id esta
  fresco. El sync ahora, ademas de la lista, selecciona los partidos que
  arrancaron en las ultimas ~30h (`selectMatchIdsToRefresh`) y los pide en una
  sola request en lote (`getMatchesByIds` -> `/matches?ids=...`), mergeando ese
  score/winner antes del upsert. Pensado para el cron horario. Con tests.
- Fix sync standings (Mundial 2026): el endpoint `/standings` devuelve una unica
  tabla `TOTAL` plana de 48 equipos con `group: null`. `extractGroupedStandings`
  exigia `Boolean(standing.group)` y descartaba todo, cayendo al calculo local
  que depende de los goles de `/matches` (que llegan con retraso/`null`). Se
  agrego `extractApiTotalStandings`, que mapea la tabla plana a cada grupo via
  las membresias del fixture y re-rankea por grupo. Cadena de prioridad:
  feed agrupado -> tabla TOTAL plana -> calculo local. Con tests.

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
- Login simple con usuarios en DB.
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
- Pantalla `/groups` con tabla completa por grupo:
  - posicion
  - PJ/G/E/P
  - GF/GC/DG
  - puntos
  - layout de maximo 2 grupos por fila para evitar scroll horizontal innecesario
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
- Cliente football-data.org.
- Mapper football-data.org.
- Sync idempotente football-data.org.
- Endpoint cron `/api/cron/sync`.
- Script `npm run sync:football-data`.
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
- Evaluacion real de football-data.org documentada en `docs/football-data-evaluation.md`:
  - token validado
  - 48 equipos disponibles para Mundial 2026
  - 104 partidos disponibles con rango completo del torneo
  - headers reales de throttling identificados
  - criterio de goles sin tanda de penales documentado
- Sync football-data.org implementado en paralelo:
  - cliente con `X-Auth-Token`
  - throttling por headers
  - mapper de stages/status/penales
  - upsert de equipos, grupos, membresias, partidos y posiciones
  - calculo local de posiciones por grupo desde partidos finalizados cuando standings venga plano
  - script `npm run sync:football-data`
  - admin y cron apuntando a football-data.org
- Tests agregados para mapper football-data.org y calculo local de standings.
- Plan de migracion a football-data.org definido en este backlog.
- Usuarios en DB via `app_users`.
- Passwords hasheadas con `scrypt`.
- Bootstrap inicial de admin en migracion:
  - usuario `admin`
  - password inicial `admin`
  - debe cambiarse desde `/admin`
- `/admin` permite:
  - alta/actualizacion de usuarios
  - cambio de password
  - activar/desactivar usuarios
- Integracion vieja eliminada.
- Schema y migracion base usan nombres neutrales:
  - `teams.external_team_id`
  - `matches.external_fixture_id`
- Script protegido para resetear DB dev:
  - `npm run db:reset-dev`
  - pide confirmacion interactiva escribiendo `RESET DEV DB`
  - borra `public` y `drizzle` para que `db:migrate` pueda recrear todo desde cero
- Sync real football-data.org validado contra Supabase dev:
  - 48 equipos
  - 12 grupos
  - 104 partidos
  - 48 standings
  - distribucion de fases esperada
  - 4 equipos por grupo
- Banderas/escudos de selecciones renderizadas desde `teams.flag_url`:
  - home
  - grupos
  - listado de partidos
  - detalle de partido
  - formulario de pronostico
  - especiales
- `next/image` configurado para `crests.football-data.org`.
- Home ajustada:
  - sin contadores de equipos/partidos/posiciones
  - texto sin mencionar fecha simulada
  - banderas en partidos del proximo cierre
  - link a agenda
- Home y menu principal ajustados:
  - nav principal marca el item actual, incluyendo rutas hijas y aliases publicos
  - badge de proximo cierre de partidos renombrado a "Pronosticos de partidos"
  - proximo cierre fusiona faltantes de partidos/especiales cuando cierran en el mismo horario
  - lideres de grupo y sorpresa negativa aparecen junto a partidos si cierran al inicio del Mundial
- Agenda por dia agregada en `/agenda`.
- Fixture ajustado:
  - titulo de vista cambiado a "Fixture"
  - fecha/hora de partido mas visible
  - eliminatorias ordenadas por filas de instancia
- Rutas publicas alineadas al contenido de cada pantalla:
  - `/fixture`
  - `/fixture/[id]`
  - `/agenda`
  - `/grupos`
  - `/especiales`
  - `/ranking`
  - `/admin`
- Endpoint `/api/cron/sync` acepta `Authorization: Bearer $CRON_SECRET`.
- Usuarios en DB implementados:
  - tabla `app_users`
  - login contra DB
  - passwords con hash `scrypt`
  - ranking y pronosticos visibles usan usuarios activos de DB
  - admin puede crear/actualizar usuarios, cambiar passwords y activar/desactivar
- Deploy Docker preparado:
  - `Dockerfile` multi-stage con Next standalone
  - imagen base Debian conservadora con Node 20.19.x instalado desde tarball oficial para evitar manifests OCI de `node:*`
  - `docker-compose.yml` con Traefik y HTTPS automatico via Let's Encrypt
  - dominio y email ACME definidos directamente en `docker-compose.yml`
  - servicios operativos `migrate` y `sync-once`
  - `.env.production.example` como plantilla para crear `.env` con variables de la app
  - comandos documentados con `docker-compose` v1 por compatibilidad del server
  - workaround documentado para Docker daemon viejo (`DOCKER_API_VERSION=1.40`, BuildKit off)
  - guia en `docs/deployment-docker.md`
- Deploy Vercel documentado:
  - sin `output: "standalone"` en Next config
  - app en Vercel
  - sync horario con cron externo via `curl`
  - guia en `docs/deployment-vercel.md`
- Logout corregido:
  - `Salir` usa server action por POST
  - `GET /logout` ya no borra cookie para evitar logout por prefetch de Next
- Conexion DB revertida al comportamiento del deploy funcional `2cd0da0`:
  - el ajuste de pool/cache en produccion dejaba Vercel colgado
  - el sync completo no debe correrse desde `/admin` en Vercel hasta moverlo fuera del runtime web
- Conexion DB:
  - cliente DB alineado al ejemplo oficial Supabase + Drizzle
  - singleton de modulo con `postgres(DATABASE_URL, { prepare: false })`
  - sin `globalThis`, sin `Proxy`, sin pool custom
  - nav principal con `prefetch={false}` por transaction pooler
- Performance inicial ajustada:
  - `getCurrentUser()` deduplicado por request con `cache()`
  - home deja de consultar `getAdminSummary()` porque ya no muestra esos contadores
  - ranking y dashboard de home se cargan en paralelo
- Robustez DB en serverless (fix del cuelgue de la home / `FUNCTION_INVOCATION_TIMEOUT` 300s en Vercel):
  - causa raiz: conexion TCP del pool reusada tras congelamiento de la instancia de Vercel (socket muerto del lado del pooler) o proyecto Supabase pausado -> la query nunca recibe respuesta y cuelga hasta el limite de la funcion; `connect_timeout`/`statement_timeout` no alcanzan porque la query no llega a un backend vivo
  - `src/db/with-timeout.ts`: `withDbTimeout()` pone un techo duro de 8s a toda operacion de DB y convierte el cuelgue en `DbTimeoutError` visible
  - `withDbTimeout` aplicado en toda la capa `src/db/queries/*`
  - `src/db/client.ts` endurecido para serverless: singleton guardado en `globalThis` (evita fuga de pools por HMR en dev), `idle_timeout`, `max_lifetime`, `connect_timeout`, `statement_timeout` y `max: 10` (no `max: 1`, porque la home dispara ~14 queries concurrentes ranking+dashboard)
  - pendiente operativo: la DB de prod en Vercel debe estar poblada y no pausada (`npm run sync:football-data`)
- Cache del ranking (fix de eficiencia y del "a veces no carga el ranking"):
  - `getRanking`/`getRankingDetail` envueltos en `unstable_cache` (tag `ranking`, `revalidate` 60s)
  - el ranking se computa una vez por ventana y se sirve de cache (stale-while-revalidate), en vez de traer 7 tablas enteras y re-scorear a todos los usuarios en cada render de la home
  - reduce el fan-out a la DB por request -> mucha menos exposicion al timeout de conexion rancia que hacia que el ranking no cargara
  - invalidacion on-demand con `revalidateTag("ranking", "max")` tras sync (cron `/api/cron/sync` y accion de admin) y tras alta/activacion de usuarios
- Cache de `/grupos` (`getGroupsView`): mismo patron, tag `groups`, `revalidate` 60s, invalidado en sync. Es data global (standings/equipos) y no sensible al tiempo.
- Eficiencia `getMatchList`: ahora filtra `matchPredictions`/`userAllIns` por `username` en SQL (`where eq`) en vez de traer las tablas enteras y filtrar en JS. Mejora `/fixture` y `/agenda` sin cache.
- Pendiente (no hecho aun): cache de `/fixture` (`getMatchList`) y `/especiales` (`getSpecialsView`). Son pesadas pero por-usuario y sensibles al tiempo (abierto/cerrado por deadline), asi que cachearlas requiere split de data global (partidos/equipos/grupos/standings, cacheable) vs por-usuario (predicciones, fresca) + invalidacion read-your-own-writes al pronosticar.
- Fix de carga de env en scripts tsx (`sync:football-data`, `db:seed*`, `db:reset-dev`):
  - fallaban con `Missing required env var: DATABASE_URL` porque los `import` estaticos (incluido `@/db/client`, que lee el env al cargarse) corren antes del `config({ path: ".env.local" })`
  - `src/lib/load-env.ts` centraliza la carga y se importa primero en cada script para que el env quede listo antes de evaluar cualquier modulo que lo lea
- Pagina `/reglamento` agregada al menu principal:
  - explica puntos de partidos, All-In y especiales
  - documenta cierres por tipo de pronostico
  - aclara penales en eliminatorias, visibilidad y partidos pendientes
  - criterios de puntos separados entre fase de grupos y eliminatorias
  - copy alineado con la etiqueta "Full" usada en la UI
  - badges de puntos consistentes tambien en especiales, manteniendo textos largos fuera del chip
- Especiales ajustado:
  - lideres de grupo no muestran resultado ni puntos hasta que termine la fase de grupos
  - ranking tampoco puntua lideres de grupo antes de standings completos
  - auditado ranking para confirmar que partidos, All-In, sorpresa negativa y podio no suman antes de tener resultado computable
- DB self-hosted preparada:
  - `docker-compose.postgres.yml` dedicado con Postgres prod y dev en puertos no estandar (`5543` y `5544`)
  - datos persistidos en volumenes separados
  - `DATABASE_SSL` permite usar `ssl=require` para Supabase o `ssl=disable` para Postgres Docker sin TLS
  - guia operativa en `docs/self-hosted-postgres.md`
- Agenda ajustada:
  - cada partido muestra pronostico propio, resultado, puntos y tipo de acierto igual que el fixture
  - cambios de pronostico y All-In revalidan tambien `/agenda`
  - filtros por query string para proximos, faltantes, abiertos, cargados, cerrados, puntuados y todos
  - filtro default en `/agenda` muestra solo partidos proximos o en curso

## Bloqueado / externo

- Falta probar sync end-to-end contra Supabase prod.
- Falta correr verificacion local final luego de migracion de usuarios y agenda:
  - `npm run db:migrate`
  - `npm run lint`
  - `npm test`
  - `npm run build`

## Proximo

### 1. Validacion visual con datos reales en dev

Objetivo: revisar la app con datos reales ya sincronizados en Supabase dev.

- Revisar en UI:
  - `/groups`
  - `/matches`
  - `/agenda`
  - `/specials`
  - `/admin`
- Validar que eliminatorias futuras aparecen como TBD.
- Validar que los equipos de sorpresa negativa aparecen correctamente.
- Validar que el admin puede repetir sync sin duplicar registros.
- Validar alta/cambio de password de usuarios desde `/admin`.
- Si queda OK, documentar el mismo flujo para Supabase prod.

### 2. Base productiva

Objetivo: preparar DB limpia para produccion.

- Levantar Postgres self-hosted en EC2 con `docker-compose.postgres.yml`.
- Configurar security group/firewall para exponer solo los puertos necesarios (`5543` prod, `5544` dev) desde origenes confiables.
- Copiar connection string de prod en `DATABASE_URL`.
- Configurar `DATABASE_SSL=disable` mientras Postgres Docker no tenga TLS.
- Ejecutar `npm run db:migrate` contra prod con aprobacion explicita.
- Ejecutar `npm run sync:football-data` contra prod con aprobacion explicita.
- No correr seeds en prod.
- Validar conteos esperados:
  - 48 equipos
  - 12 grupos
  - 104 partidos
  - standings iniciales por grupo con 4 equipos cada uno y 0 PJ.

### 3. Deploy Vercel

Objetivo: publicar una version usable en Vercel con sync automatico externo.

- Crear proyecto Vercel conectado al repo.
- Configurar env vars de Production:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `CRON_SECRET`
  - `FOOTBALL_DATA_API_TOKEN`
  - `FOOTBALL_DATA_BASE_URL`
  - `FOOTBALL_DATA_COMPETITION`
  - `FOOTBALL_DATA_SEASON`
  - `SIMULATION_MODE=false`
- No configurar `SIMULATION_NOW` en produccion.
- Ejecutar `npm run db:migrate` contra Supabase prod.
- Ejecutar `npm run sync:football-data` contra Supabase prod.
- Configurar cron externo contra `/api/cron/sync`:
  - base recomendada: cada 1 hora.
  - durante dias con partidos: bajar a cada 15 o 30 minutos solo si el cupo de football-data.org lo permite.
  - despues del Mundial: apagar o dejar diario.

### 4. Checklist pre-lanzamiento

- Validar login con todos los usuarios reales.
- Validar que admin pueda sincronizar.
- Validar home, partidos, grupos, especiales y ranking con DB real.
- Validar deadlines con horario Argentina.
- Validar que `SIMULATION_MODE=false` en produccion.
- Validar que el fixture real no deja equipos `TBD` en fase de grupos.
- Validar que eliminatorias futuras aparecen aunque no tengan equipos.
- Documentar comandos operativos:
  - sync manual
  - migraciones
  - rollback simple
  - rotacion de passwords si hiciera falta

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
npm run db:reset-dev
npm run db:migrate
npm run sync:football-data
npm run db:seed:group-stage-mid
npm run dev -- --port 3001
docker-compose up -d --build app traefik
docker-compose run --rm migrate
docker-compose run --rm sync-once
```

