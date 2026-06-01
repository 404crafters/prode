# Evaluacion football-data.org para Mundial 2026

Fecha de prueba: 2026-06-01

## Resultado corto

football-data.org cubre lo necesario para el MVP:

- Equipos del Mundial 2026.
- Fixture completo del Mundial 2026.
- Fechas y horas UTC de inicio de partidos.
- Grupos del fixture.
- Slots futuros de eliminatorias sin equipos definidos.
- Resultados y ganador del partido cuando se juegue.
- Tabla de posiciones con los campos necesarios.

No necesitamos jugadores porque se quitaron Balon de Oro, goleador y mejor arquero.

## Endpoints validados

Todos los requests usan el header `X-Auth-Token`.

```text
GET https://api.football-data.org/v4/competitions/WC?season=2026
GET https://api.football-data.org/v4/competitions/WC/teams?season=2026
GET https://api.football-data.org/v4/competitions/WC/matches?season=2026&dateFrom=2026-06-11&dateTo=2026-07-19
GET https://api.football-data.org/v4/competitions/WC/standings?season=2026
```

## Hallazgos de la prueba

- Token valido: la API autentico el cliente.
- `teams?season=2026` devolvio 48 equipos.
- `matches?season=2026&dateFrom=2026-06-11&dateTo=2026-07-19` devolvio 104 partidos.
- Distribucion del fixture:
  - `GROUP_STAGE`: 72 partidos.
  - `LAST_32`: 16 partidos. En nuestra app esto debe mapearse a `round_of_32` y mostrarse como `16avos`.
  - `LAST_16`: 8 partidos. En nuestra app esto debe mapearse a `round_of_16` y mostrarse como `Octavos`.
  - `QUARTER_FINALS`: 4 partidos.
  - `SEMI_FINALS`: 2 partidos.
  - `THIRD_PLACE`: 1 partido.
  - `FINAL`: 1 partido.
- Los 12 grupos (`GROUP_A` a `GROUP_L`) vienen en los partidos de fase de grupos.
- Los 32 partidos de eliminatorias existen como slots futuros con equipos TBD.
- El endpoint `standings?season=2026` hoy devuelve `TOTAL`, `HOME` y `AWAY`, pero como tablas planas de 48 equipos con `group = null`.

## Rate limit / throttling

La documentacion lista estos headers:

- `X-API-Version`
- `X-Authenticated-Client`
- `X-RequestCounter-Reset`
- `X-RequestsAvailable`

En la prueba real, el header de requests restantes vino como:

- `X-Requests-Available-Minute`

Conclusion: el cliente debe soportar ambos nombres (`X-RequestsAvailable` y `X-Requests-Available-Minute`) y usar `X-RequestCounter-Reset` para esperar automaticamente si queda poco margen o aparece un `429`.

## Resultados en eliminatorias

football-data indica en su documentacion que en partidos definidos por penales `score/fullTime` puede representar el resultado "despues de penales", y que `score/penalties` contiene solo la tanda. Tambien existe `score/regularTime` cuando aplica.

Para nuestras reglas, los goles del partido no deben incluir la definicion por penales. Por eso el mapper debe:

1. Usar `score.winner` para definir el ganador final.
2. Si `duration = PENALTY_SHOOTOUT`, persistir `homeGoals/awayGoals` sin la tanda de penales:
   - preferir `regularTime + extraTime` cuando ambos nodos existan;
   - o restar `penalties` de `fullTime` como fallback.
3. Si `duration = EXTRA_TIME`, persistir el score final del partido incluyendo alargue.
4. Si `duration = REGULAR`, persistir `fullTime`.

## Decision para posiciones por grupo

Aunque el endpoint de standings trae los campos necesarios (`position`, `playedGames`, `won`, `draw`, `lost`, `points`, `goalsFor`, `goalsAgainst`, `goalDifference`), hoy no separa por grupo en la respuesta 2026.

Para nuestra app conviene:

1. Persistir grupos y partidos desde `matches`, porque ahi si viene `group`.
2. Para la tabla visual de grupos, usar la tabla local `standings` por `groupId/teamId`.
3. Al sincronizar football-data, si `standings` sigue viniendo plano, agrupar localmente por los grupos ya conocidos desde `group_teams`; si la API empieza a devolver standings por grupo, mapearlos directo.
4. Como fallback robusto, poder recalcular standings localmente desde partidos de fase de grupos finalizados.

## Fuentes

- https://docs.football-data.org/general/v4/lookup_tables.html#_response_headers
- https://docs.football-data.org/general/v4/competition.html
- https://docs.football-data.org/general/v4/overtime.html

