# Prode Mundial 2026 - Backlog inicial

## Epic 1 - Bootstrap tecnico

### US-001 - Crear proyecto base

Como desarrollador, quiero tener una aplicacion Next.js configurada para poder empezar a construir el MVP.

Criterios de aceptacion:

- El proyecto corre localmente.
- TypeScript esta habilitado.
- Tailwind esta configurado.
- Hay layout base.
- Hay pagina home temporal.

### US-002 - Configurar base de datos

Como desarrollador, quiero conectar la app a Supabase Postgres con Drizzle para persistir datos del prode.

Criterios de aceptacion:

- `DATABASE_URL` se lee desde env.
- Drizzle esta configurado.
- Existe schema inicial.
- Se puede ejecutar migracion inicial.

## Epic 2 - Dominio

### US-003 - Calcular deadlines

Como usuario, quiero que la app cierre cargas segun fecha Argentina para que todos tengan la misma regla.

Criterios de aceptacion:

- Un partido cierra a las 00:00 Argentina del dia del partido.
- Los especiales de inicio de Mundial cierran a las 00:00 Argentina del primer partido.
- Los especiales de eliminatorias cierran a las 00:00 Argentina del primer partido eliminatorio.
- Hay tests unitarios.

### US-003B - Controlar reloj en development

Como desarrollador, quiero poder setear la fecha/hora actual por env para probar cierres y visibilidad antes del Mundial.

Criterios de aceptacion:

- Existe un helper unico `getNow()`.
- Con `SIMULATION_MODE=false`, usa fecha real.
- Con `SIMULATION_MODE=true`, usa `SIMULATION_NOW`.
- Si falta `SIMULATION_NOW` en simulation mode, falla explicitamente.
- La app muestra un indicador visible cuando simulation mode esta activo.
- La pantalla admin muestra el valor actual de `SIMULATION_NOW`.

### US-004 - Calcular scoring de fase de grupos

Como usuario, quiero que mis pronosticos de fase de grupos sumen segun las reglas acordadas.

Criterios de aceptacion:

- Exacto suma 5.
- Signo exacto suma 3.
- Parcial entre empate y victoria/derrota suma 1.
- Ganador contrario suma 0.
- Sin pronostico suma 0.
- Hay tests unitarios.

### US-005 - Calcular scoring de eliminatorias

Como usuario, quiero que mis pronosticos de eliminatorias consideren score sin penales y ganador final.

Criterios de aceptacion:

- Score exacto y ganador final correcto suma 5.
- Ganador final correcto suma 3.
- Score exacto y ganador final incorrecto suma 1.
- Todo lo demas suma 0.
- Hay tests unitarios.

## Epic 2B - Seeds de simulacion

### US-005B - Crear runner de seeds

Como desarrollador, quiero cargar escenarios de datos con un comando para probar distintos momentos del Mundial.

Criterios de aceptacion:

- Existe un comando `db:seed`.
- El comando recibe nombre de escenario.
- El seed limpia datos de torneo y pronosticos antes de cargar.
- El comando rechaza ejecucion en produccion.
- Los usuarios siguen viniendo desde config, no desde DB.

### US-005C - Seed pre-worldcup

Como desarrollador, quiero cargar un escenario previo al Mundial para probar cargas abiertas.

Criterios de aceptacion:

- Hay equipos, grupos y partidos.
- No hay resultados.
- Lideres de grupo y sorpresa negativa estan abiertos.
- Podio esta abierto.
- Partidos futuros estan abiertos.

### US-005D - Seed group-stage-day-1

Como desarrollador, quiero cargar un escenario del primer dia del Mundial para probar cierres iniciales.

Criterios de aceptacion:

- Lideres de grupo y sorpresa negativa estan cerrados.
- Partidos del dia estan cerrados y sus pronosticos son visibles.
- Partidos futuros siguen abiertos.

### US-005E - Seed group-stage-mid

Como desarrollador, quiero cargar un escenario de fase de grupos en curso para probar ranking parcial.

Criterios de aceptacion:

- Hay partidos finalizados.
- Hay partidos cerrados sin resultado.
- Hay partidos futuros abiertos.
- Hay pronosticos de prueba.
- El ranking parcial tiene datos variados.

### US-005F - Seed group-stage-finished

Como desarrollador, quiero cargar un escenario con fase de grupos terminada para probar lideres y sorpresa negativa.

Criterios de aceptacion:

- Todos los grupos tienen standings completos.
- Lideres de grupo son puntuables.
- Sorpresa negativa es puntuable.
- Podio puede seguir abierto si el reloj simulado es anterior a eliminatorias.

### US-005G - Seed knockouts-start

Como desarrollador, quiero cargar un escenario de inicio de eliminatorias para probar cierre de podio.

Criterios de aceptacion:

- Hay partidos eliminatorios con equipos definidos.
- Campeon, subcampeon y tercer puesto estan cerrados.
- Los partidos eliminatorios futuros pueden pronosticarse si no llegaron a su dia.

### US-005H - Seed knockouts-mid

Como desarrollador, quiero cargar un escenario de eliminatorias en curso para probar penales y scoring.

Criterios de aceptacion:

- Hay partidos eliminatorios finalizados.
- Hay al menos un partido definido por penales.
- Hay pronosticos con score exacto y ganador incorrecto.
- Hay pronosticos con ganador correcto y score incorrecto.

### US-005I - Seed finished-worldcup

Como desarrollador, quiero cargar un escenario de Mundial terminado para validar ranking final.

Criterios de aceptacion:

- Todos los partidos tienen resultado.
- Campeon, subcampeon y tercer puesto estan definidos.
- Ranking final es calculable.
- Hay empates de puntaje para validar premio compartido.

## Epic 3 - Login simple

### US-006 - Configurar usuarios

Como admin, quiero definir usuarios en un archivo de configuracion para evitar construir administracion de usuarios.

Criterios de aceptacion:

- Existe config con username, password, displayName y role.
- Se puede marcar un usuario como admin.
- La app no requiere tabla de usuarios.

### US-007 - Iniciar y cerrar sesion

Como usuario, quiero iniciar y cerrar sesion para acceder al prode.

Criterios de aceptacion:

- Login valida contra config.
- Credenciales invalidas muestran error.
- La sesion queda en cookie.
- Logout borra la sesion.
- Toda ruta interna requiere login.

## Epic 4 - Sincronizacion

### US-008 - Cliente API-Football

Como sistema, quiero consultar API-Football desde backend para traer datos del Mundial.

Criterios de aceptacion:

- La API key se lee desde env.
- El cliente soporta fixtures.
- El cliente soporta standings.
- Los errores quedan normalizados.

### US-009 - Sync idempotente

Como admin, quiero sincronizar datos sin duplicar registros para mantener la DB actualizada.

Criterios de aceptacion:

- Equipos se upsertean.
- Grupos se upsertean.
- Partidos se upsertean por fixture externo.
- Standings se upsertean.
- Datos previos no se borran si falla el sync.

### US-010 - Diagnostico de sync

Como admin, quiero ver el estado del sync para detectar problemas con la API.

Criterios de aceptacion:

- Cada sync crea un `sync_run`.
- Se guarda estado success o failed.
- Se guarda mensaje de error si falla.
- Admin puede ver ultimo sync y errores recientes.

## Epic 5 - Fixture y grupos

### US-011 - Ver calendario

Como usuario, quiero ver el calendario de partidos para saber que pronosticar.

Criterios de aceptacion:

- Se listan partidos desde DB.
- Se muestra fecha Argentina.
- Se muestra etapa.
- Se muestra estado.
- Se muestra resultado cuando existe.

### US-012 - Ver detalle de partido

Como usuario, quiero entrar a un partido para cargar o revisar mi pronostico.

Criterios de aceptacion:

- Se muestran equipos, fecha, etapa y estado.
- Se muestra si el partido esta abierto o cerrado.
- Se muestra resultado si existe.

### US-013 - Ver grupos y standings

Como usuario, quiero ver grupos y posiciones para seguir el torneo.

Criterios de aceptacion:

- Se muestran los 12 grupos.
- Se muestran selecciones por grupo.
- Se muestran standings sincronizados cuando existan.

## Epic 6 - Pronosticos de partidos

### US-014 - Cargar pronostico de grupos

Como usuario, quiero cargar goles en partidos de fase de grupos.

Criterios de aceptacion:

- Puedo cargar goles de ambos equipos.
- No puedo cargar goles negativos.
- No puedo editar si el partido cerro.
- El pronostico se guarda por usuario y partido.

### US-015 - Cargar pronostico de eliminatorias

Como usuario, quiero cargar score y ganador final cuando haga falta en eliminatorias.

Criterios de aceptacion:

- Si el score no es empate, el ganador se infiere.
- Si el score es empate, debo elegir ganador.
- No puedo elegir un ganador que no juegue el partido.
- No puedo editar si el partido cerro.

### US-016 - Ver pronosticos del resto

Como usuario, quiero ver las predicciones de otros despues del cierre.

Criterios de aceptacion:

- Antes del cierre solo veo mi pronostico.
- Desde el dia del partido veo pronosticos de todos.
- Si un usuario no cargo, aparece como pendiente o sin pronostico.

## Epic 7 - All-In

### US-017 - Elegir All-In

Como usuario, quiero elegir un partido All-In para triplicar mis puntos de ese partido.

Criterios de aceptacion:

- Puedo elegir un unico partido.
- Solo puedo elegir partidos abiertos.
- El ranking aplica multiplicador cuando el partido tiene puntos.

### US-018 - Cambiar All-In

Como usuario, quiero mover mi All-In a otro partido futuro mientras este permitido.

Criterios de aceptacion:

- Puedo cambiarlo si el partido actual sigue abierto.
- Puedo cambiarlo si el nuevo partido esta abierto.
- No puedo cambiarlo si el partido actual ya cerro.

## Epic 8 - Especiales

### US-019 - Pronosticar lideres de grupo

Como usuario, quiero elegir el lider de cada grupo.

Criterios de aceptacion:

- Puedo elegir un equipo por grupo.
- Solo puedo elegir equipos del grupo.
- Cierra al inicio del Mundial.
- Cada acierto suma 3 puntos.

### US-020 - Pronosticar sorpresa negativa

Como usuario, quiero elegir una sorpresa negativa entre las selecciones permitidas.

Criterios de aceptacion:

- Puedo elegir una de las opciones configuradas.
- Cierra al inicio del Mundial.
- Si no clasifica a eliminatorias, suma 5 puntos.

### US-021 - Pronosticar podio

Como usuario, quiero elegir campeon, subcampeon y tercer puesto.

Criterios de aceptacion:

- Puedo elegir entre las 48 selecciones.
- Cierra al inicio de eliminatorias.
- Campeon suma 15.
- Subcampeon suma 8.
- Tercer puesto suma 5.

## Epic 9 - Ranking y home

### US-022 - Ver ranking

Como usuario, quiero ver el ranking general para seguir la competencia.

Criterios de aceptacion:

- Se muestra total por usuario.
- Se muestran empates compartidos.
- Se muestra desglose resumido.
- Se calcula desde DB y config de usuarios.

### US-023 - Ver detalle de puntos

Como usuario, quiero entender de donde salen mis puntos.

Criterios de aceptacion:

- Veo puntos por partido.
- Veo puntos por especiales.
- Veo efecto de All-In.

### US-024 - Ver faltantes proximos en home

Como usuario, quiero saber que me falta cargar antes del proximo cierre.

Criterios de aceptacion:

- Se muestra proximo cierre.
- Se muestra contador simple.
- Se muestran faltantes accionables.
- Hay links a las pantallas correspondientes.

## Epic 10 - Admin

### US-025 - Ejecutar sync manual

Como admin, quiero ejecutar una sincronizacion manual.

Criterios de aceptacion:

- Solo admin ve la accion.
- El boton dispara sync.
- Se muestra resultado.
- Se registra `sync_run`.

### US-026 - Ver panel admin

Como admin, quiero ver diagnostico operativo basico.

Criterios de aceptacion:

- Veo ultimo intento de sync.
- Veo ultimo sync exitoso.
- Veo errores recientes.
- Veo cantidad de equipos, partidos y standings.
