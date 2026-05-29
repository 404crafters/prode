# Prode Mundial 2026 - Documento funcional

## 1. Objetivo

Construir una aplicacion web interna para que un grupo reducido de usuarios de oficina participe en un prode del Mundial de Futbol 2026.

La aplicacion debe permitir cargar pronosticos de partidos y pronosticos especiales, bloquear cargas segun fechas definidas, mostrar las predicciones del resto cuando corresponda, sincronizar datos oficiales desde API-Football, calcular puntajes y mantener un ranking individual.

El alcance prioriza simplicidad operativa sobre seguridad avanzada, administracion compleja o features sociales.

## 2. Alcance del MVP

Incluido:

- Login simple con usuarios definidos en configuracion estatica.
- Usuario admin definido en configuracion estatica.
- Fixture, equipos, grupos, standings, estados y resultados sincronizados desde API-Football.
- Persistencia local en Supabase Postgres.
- Calendario de partidos.
- Vista de grupos.
- Carga y edicion de pronosticos de partidos.
- Carga y edicion de pronosticos especiales.
- Seleccion y cambio de partido All-In.
- Bloqueo de carga segun fecha local de Argentina.
- Visibilidad de pronosticos del resto una vez cerrado el plazo de carga.
- Calculo de puntos.
- Ranking individual.
- Home con ranking, proximo cierre y faltantes del usuario.
- Pantalla admin minima para sincronizacion y diagnostico.

Fuera de alcance:

- Recuperacion de contraseña.
- Registro publico de usuarios.
- OAuth, magic links o email corporativo.
- Auditoria o historial de cambios.
- Equipos/areas dentro de la oficina.
- Exportacion a Excel/CSV.
- Mobile-first o optimizacion especifica para mobile.
- Correccion manual de resultados.
- Premios dentro de la app.
- Balon de Oro, goleador y mejor arquero.
- Notificaciones por email, Slack o push.

## 3. Usuarios y acceso

### 3.1 Tipos de usuario

Usuario comun:

- Puede iniciar sesion.
- Puede cargar y editar sus pronosticos mientras esten abiertos.
- Puede ver sus propios pronosticos siempre.
- Puede ver pronosticos de otros usuarios cuando el periodo de carga correspondiente ya cerro.
- Puede ver ranking y detalle de puntos.

Admin:

- Tiene las mismas capacidades que un usuario comun.
- Puede ejecutar sincronizacion manual.
- Puede ver estado del ultimo sync.
- Puede ver errores de sincronizacion.
- Puede acceder a datos operativos basicos.

### 3.2 Configuracion de usuarios

Los usuarios se definen en un archivo de configuracion estatica.

Formato funcional esperado:

- username
- password en texto plano
- displayName
- role: user o admin
- active: booleano opcional

No hay recuperacion de contraseña ni administracion de usuarios desde la UI.

### 3.3 Reglas de acceso

- Toda la aplicacion requiere login.
- Un usuario no autenticado solo puede ver la pantalla de login.
- La sesion puede ser simple, basada en cookie.
- No se requiere seguridad fuerte porque el uso es interno y los participantes son de confianza.

## 4. Zona horaria y reglas de cierre

Todas las reglas de cierre usan fecha local de Argentina.

La carga de un pronostico cierra al comenzar el dia del evento asociado.

Ejemplo:

- Partido: 15 de junio de 2026, hora Argentina.
- Ultimo momento editable: 14 de junio de 2026 23:59:59 Argentina.
- Desde 15 de junio de 2026 00:00:00 Argentina: cerrado.

Esta regla aplica a:

- Pronosticos de partidos.
- Seleccion de All-In.
- Lideres de grupo.
- Sorpresa negativa.
- Campeon.
- Subcampeon.
- Tercer puesto.

## 5. Datos sincronizados

La aplicacion no debe consultar API-Football desde el frontend.

La sincronizacion se realiza desde backend/jobs. Los datos se guardan en Supabase Postgres y el frontend consulta solamente la base de datos propia.

### 5.1 Datos esperados desde API-Football

- Equipos/selecciones.
- Grupos.
- Fixture.
- Fecha y hora de partidos.
- Sede opcional.
- Instancia del partido.
- Estado del partido.
- Resultado.
- Ganador final en partidos eliminatorios.
- Standings de fase de grupos.

### 5.2 Frecuencia de sincronizacion

Antes del Mundial:

- Sync periodico de fixture, equipos y grupos.
- Frecuencia baja, por ejemplo una vez por dia.

Durante el Mundial:

- Sync mas frecuente en dias de partido.
- La frecuencia exacta se define en el plan tecnico segun limite de requests del free tier.

### 5.3 Sin correccion manual

No se incluye correccion manual de resultados.

Si API-Football falla o no trae un dato necesario, se debe mostrar el problema en la pantalla admin. La resolucion operativa queda fuera del MVP y se evaluara si aparece el caso.

## 6. Estructura del Mundial

La app debe soportar:

- 48 selecciones.
- 12 grupos.
- Fase de grupos.
- Fase eliminatoria desde 32avos de final.
- Partido por tercer puesto.
- Final.

Las instancias funcionales minimas son:

- Grupo
- 32avos
- 16avos
- Cuartos
- Semifinal
- Tercer puesto
- Final

La nomenclatura exacta puede adaptarse a la que entregue API-Football, pero la app debe poder clasificar un partido como fase de grupos o eliminatoria.

## 7. Pronosticos de partidos

### 7.1 Carga en fase de grupos

Para cada partido de fase de grupos, el usuario carga:

- Goles del equipo A.
- Goles del equipo B.

No se carga ganador separado porque el empate es valido.

### 7.2 Carga en fase eliminatoria

Para cada partido eliminatorio, el usuario carga:

- Goles del equipo A, sin considerar penales.
- Goles del equipo B, sin considerar penales.
- Ganador final solamente si los goles pronosticados son iguales.

Si los goles pronosticados no son iguales, el ganador se infiere por el score.

Ejemplo:

- Argentina 2 - Francia 1: ganador inferido Argentina.
- Argentina 1 - Francia 1: el usuario debe elegir ganador final Argentina o Francia.

### 7.3 Edicion

- El usuario puede modificar su pronostico cuantas veces quiera mientras el plazo este abierto.
- El plazo cierra el dia del partido a las 00:00 Argentina.
- El mismo dia del partido ya no se puede cargar ni editar.

### 7.4 Falta de pronostico

Si un usuario no carga pronostico para un partido, obtiene 0 puntos para ese partido.

### 7.5 Visibilidad

Antes del cierre:

- El usuario ve solamente su pronostico.
- No ve los pronosticos del resto.

Desde el dia del partido:

- El partido queda cerrado.
- Todos los usuarios pueden ver los pronosticos de todos para ese partido.

## 8. All-In

Cada usuario puede elegir un unico partido del Mundial como All-In.

Reglas:

- El All-In triplica los puntos obtenidos en ese partido.
- Puede cambiarse mientras el partido actualmente elegido y el nuevo partido elegido esten abiertos para carga.
- La restriccion de cierre es la misma que para el pronostico del partido: hasta el dia anterior al partido.
- El usuario puede mover su All-In a otro partido futuro aunque ya hayan empezado otros partidos del Mundial.
- Si el partido elegido ya cerro, el All-In queda fijado.
- Si el usuario no elige All-In, no recibe multiplicador en ningun partido.

Ejemplos de multiplicador:

- Pronostico exacto: 5 puntos base, 15 puntos con All-In.
- Pronostico full: 3 puntos base, 9 puntos con All-In.
- Pronostico parcial: 1 punto base, 3 puntos con All-In.
- Pronostico incorrecto: 0 puntos base, 0 puntos con All-In.

## 9. Pronosticos especiales

### 9.1 Lideres de grupo

El usuario elige el lider de cada grupo.

Reglas:

- Un pronostico por grupo.
- Cierra el dia de inicio del Mundial a las 00:00 Argentina.
- Puntaje: 3 puntos por cada lider acertado.
- Se calcula contra la posicion final del grupo segun standings oficiales sincronizados.

### 9.2 Sorpresa negativa

El usuario elige una seleccion candidata que no clasificara a eliminatorias.

Opciones validas:

- Argentina
- Brasil
- Alemania
- Francia
- España
- Inglaterra
- Holanda

Reglas:

- El usuario elige una unica seleccion.
- Cierra el dia de inicio del Mundial a las 00:00 Argentina.
- Puntaje: 5 puntos si la seleccion elegida no clasifica a eliminatorias.
- Si clasifica a eliminatorias, suma 0 puntos.

### 9.3 Campeon, subcampeon y tercer puesto

El usuario elige libremente entre las 48 selecciones:

- Campeon.
- Subcampeon.
- Tercer puesto.

Reglas:

- Cierra el dia de inicio de la fase eliminatoria a las 00:00 Argentina.
- Campeon acertado: 15 puntos.
- Subcampeon acertado: 8 puntos.
- Tercer puesto acertado: 5 puntos.
- Cada seleccion puede elegirse libremente, aunque la combinacion no sea consistente con el bracket.

## 10. Scoring de partidos

Los puntajes de un partido son excluyentes. Se asigna solo el mayor criterio aplicable.

### 10.1 Fase de grupos

Exacto - 5 puntos:

- El usuario acierta los goles exactos de ambos equipos.

Full - 3 puntos:

- El usuario acierta el signo del partido:
  - Gana equipo A.
  - Empate.
  - Gana equipo B.

Parcial - 1 punto:

- El usuario no acierta exacto ni full.
- Aplica si el pronostico y el resultado real estan entre empate y victoria/derrota.
- Casos validos:
  - Usuario puso ganador y el partido termino empatado.
  - Usuario puso perdedor y el partido termino empatado.
  - Usuario puso empate y gano un equipo.
  - Usuario puso empate y perdio un equipo.

Incorrecto - 0 puntos:

- El usuario pronostico ganador contrario.
- No hay pronostico.

Ejemplos:

- Real: Argentina 2 - Francia 1. Pronostico: Argentina 2 - Francia 1. Resultado: 5 pts.
- Real: Argentina 2 - Francia 1. Pronostico: Argentina 1 - Francia 0. Resultado: 3 pts.
- Real: Argentina 2 - Francia 1. Pronostico: Argentina 1 - Francia 1. Resultado: 1 pt.
- Real: Argentina 2 - Francia 1. Pronostico: Argentina 0 - Francia 1. Resultado: 0 pts.
- Real: Argentina 1 - Francia 1. Pronostico: Argentina 2 - Francia 1. Resultado: 1 pt.

### 10.2 Fase eliminatoria

Exacto - 5 puntos:

- El usuario acierta los goles exactos de ambos equipos sin penales.
- El usuario acierta el ganador final.

Full - 3 puntos:

- El usuario acierta el ganador final.
- No necesita acertar goles.

Parcial - 1 punto:

- El usuario acierta los goles exactos de ambos equipos sin penales.
- El usuario no acierta el ganador final.

Incorrecto - 0 puntos:

- No acierta ganador final.
- No acierta goles exactos.
- No hay pronostico.

Casos especiales:

- Si el partido real termina empatado en goles y se define por penales, el ganador final sincronizado desde API-Football es obligatorio para calcular exacto o full.
- Si el usuario acierta el score empatado pero elige mal el ganador por penales, suma 1 punto.
- Si el usuario acierta los goles pero no acierta el ganador final, suma 1 punto.
- Si el usuario acierta el ganador final pero no los goles, suma 3 puntos.

Ejemplos:

- Real: Argentina 1 - Francia 1, gana Argentina por penales. Pronostico: 1 - 1, gana Argentina. Resultado: 5 pts.
- Real: Argentina 1 - Francia 1, gana Argentina por penales. Pronostico: 1 - 1, gana Francia. Resultado: 1 pt.
- Real: Argentina 2 - Francia 1. Pronostico: Argentina 1 - Francia 0. Resultado: 3 pts.
- Real: Argentina 2 - Francia 1. Pronostico: Argentina 2 - Francia 1. Resultado: 5 pts.
- Real: Argentina 2 - Francia 1. Pronostico: Argentina 1 - Francia 2. Resultado: 0 pts.

## 11. Ranking

El ranking es individual.

El total de un usuario se compone de:

- Puntos por partidos.
- Puntos extra por All-In.
- Puntos por lideres de grupo.
- Puntos por sorpresa negativa.
- Puntos por campeon, subcampeon y tercer puesto.

Empates:

- Si dos o mas usuarios tienen el mismo puntaje total, comparten puesto y premio.
- No hay reglas de desempate.

Vista de ranking:

- Posicion.
- Usuario.
- Puntos totales.
- Puntos por partidos.
- Puntos por especiales.
- Indicador de All-In usado o pendiente.

Detalle de usuario:

- Lista de partidos con pronostico, resultado, puntos base y multiplicador.
- Lista de especiales con eleccion, resultado y puntos.

## 12. Home

La home debe orientar al usuario sobre que tiene que cargar pronto.

Componentes:

- Ranking resumido.
- Puntaje propio.
- Proximo cierre relevante.
- Contador simple hasta el proximo cierre.
- Lista de faltantes proximos.
- Partidos de hoy, con predicciones visibles.
- Accesos directos a cargar pronosticos.

### 12.1 Proximo cierre

El sistema debe detectar el cierre mas cercano entre:

- Inicio del Mundial.
- Dia de partidos futuros.
- Inicio de eliminatorias.

Ejemplos de mensajes:

- "Cierre de lideres de grupo y sorpresa negativa: 11/06/2026."
- "Cierre de pronosticos para partidos del 15/06/2026: 15/06/2026 00:00."
- "Cierre de campeon, subcampeon y tercer puesto: inicio de eliminatorias."

### 12.2 Faltantes proximos

La app debe mostrar faltantes accionables, por ejemplo:

- Te faltan 3 pronosticos para partidos que cierran proximamente.
- Te falta elegir All-In.
- Te falta elegir lider del Grupo C.
- Te falta elegir sorpresa negativa.
- Te falta elegir campeon.

No hace falta implementar notificaciones fuera de la app.

## 13. Pantallas

### 13.1 Login

Campos:

- Usuario.
- Contraseña.

Estados:

- Credenciales invalidas.
- Usuario inactivo, si aplica.

### 13.2 Home

Debe mostrar:

- Ranking resumido.
- Puntaje del usuario.
- Proximo cierre.
- Faltantes proximos.
- Partidos de hoy.

### 13.3 Calendario

Debe permitir:

- Ver todos los partidos.
- Filtrar por fase.
- Filtrar por grupo.
- Ver estado del partido.
- Ver resultado si ya existe.
- Acceder a cargar o ver pronostico.

### 13.4 Partido

Antes del cierre:

- Ver datos del partido.
- Cargar/editar pronostico propio.
- Marcar como All-In si esta permitido.
- No ver pronosticos de otros.

Despues del cierre:

- Ver datos del partido.
- Ver pronostico propio bloqueado.
- Ver pronosticos de todos.
- Ver resultado si esta disponible.
- Ver puntos asignados si el resultado esta finalizado.

### 13.5 Grupos

Debe mostrar:

- Grupos y selecciones.
- Standings sincronizados.
- Pronostico propio de lider por grupo.
- Estado abierto/cerrado para editar lideres.

### 13.6 Especiales

Debe permitir cargar:

- Lider de cada grupo.
- Sorpresa negativa.
- Campeon.
- Subcampeon.
- Tercer puesto.

Debe mostrar:

- Cierre de cada tipo de especial.
- Estado abierto/cerrado.
- Puntos obtenidos cuando corresponda.

### 13.7 Ranking

Debe mostrar:

- Ranking completo.
- Total por usuario.
- Desglose resumido.
- Empates compartidos.

### 13.8 Admin

Debe mostrar:

- Boton de sincronizacion manual.
- Fecha/hora del ultimo sync exitoso.
- Fecha/hora del ultimo intento de sync.
- Estado del ultimo sync.
- Errores recientes.
- Cantidad de equipos, partidos y standings sincronizados.

## 14. Estados funcionales

### 14.1 Partido

Estados internos esperados:

- scheduled: programado.
- in_progress: en juego.
- finished: finalizado.
- postponed: postergado.
- cancelled: cancelado.
- unknown: estado no mapeado.

La app debe poder mostrar estados desconocidos sin romper.

### 14.2 Pronostico

Estados derivados:

- missing: el usuario no cargo pronostico.
- editable: el usuario puede cargar o editar.
- locked: el plazo cerro.
- scored: el partido tiene resultado y el puntaje fue calculado.

### 14.3 Especial

Estados derivados:

- missing.
- editable.
- locked.
- scored.

## 15. Casos borde

### 15.1 Partido postergado

Si API-Football modifica la fecha de un partido, la fecha de cierre debe recalcularse con la nueva fecha.

Si el partido ya habia cerrado y luego se posterga, se acepta que el comportamiento puede quedar sujeto a revision posterior. Para el MVP, el cierre sigue la fecha actualmente sincronizada.

### 15.2 Equipo TBD

En fases eliminatorias puede haber partidos con equipos todavia no definidos.

Mientras un partido no tenga ambos equipos definidos:

- No se deberia permitir cargar pronostico.
- Se puede mostrar como pendiente.

Cuando ambos equipos se definan:

- Se habilita la carga si todavia no llego el dia del partido.

### 15.3 Cambio de fixture

Si cambia la fecha, equipo o instancia de un partido por sync:

- Se actualiza la informacion local.
- Los pronosticos existentes se conservan asociados al partido externo.
- Si el cambio deja inconsistente un pronostico, se resolvera en etapa tecnica segun el identificador estable de API-Football.

### 15.4 Resultado incompleto

Si un partido figura finalizado pero falta ganador final en eliminatoria:

- No se calcula puntaje para ese partido.
- La pantalla admin debe mostrar el problema de sync.

### 15.5 All-In en partido sin resultado

Si el usuario eligio All-In en un partido que todavia no fue puntuado:

- El ranking no refleja ese multiplicador hasta que el partido tenga resultado.

### 15.6 Usuario sin All-In

Si termina el Mundial y un usuario nunca eligio All-In:

- No hay penalidad.
- Simplemente no recibio multiplicador.

## 16. Criterios de aceptacion

- Un usuario puede iniciar sesion con credenciales definidas en config.
- Un usuario no autenticado no puede acceder a ninguna pantalla interna.
- El fixture se consulta desde la DB local, no desde API-Football en frontend.
- Un usuario puede cargar pronosticos para partidos abiertos.
- Un usuario no puede cargar ni editar pronosticos el dia del partido.
- Un usuario no puede ver pronosticos de otros antes del cierre.
- Un usuario puede ver pronosticos de otros desde el dia del partido.
- Un usuario puede elegir y mover All-In respetando la regla de cierre.
- El sistema calcula correctamente puntos de fase de grupos.
- El sistema calcula correctamente puntos de fase eliminatoria.
- El sistema calcula correctamente puntos especiales.
- El ranking muestra empates compartidos.
- La home muestra el proximo cierre y faltantes proximos.
- El admin puede ejecutar sync manual y ver diagnostico basico.

## 17. Decisiones pendientes para etapa tecnica

- Definir estructura exacta de tablas.
- Definir formato exacto de archivo de usuarios.
- Definir estrategia de sesion y cookie.
- Definir frecuencia de cron jobs en Vercel.
- Definir mapeo exacto de estados de API-Football.
- Definir como identificar inicio del Mundial e inicio de eliminatorias desde datos sincronizados o config.
- Definir estrategia de cache y limite de requests.
- Definir pruebas unitarias del motor de scoring.

## 18. Modo simulacion para desarrollo

La app debe poder probarse antes del Mundial usando datos locales controlados.

Este modo es solo para desarrollo/staging y no modifica las reglas productivas.

Capacidades:

- Activar simulation mode por variable de entorno.
- Setear la fecha/hora actual por variable de entorno.
- Cargar escenarios versionados con comandos.
- Probar cierres, visibilidad, scoring, All-In, especiales y ranking sin depender de API-Football.

Escenarios deseados:

- Antes del Mundial.
- Primer dia de fase de grupos.
- Fase de grupos en curso.
- Fase de grupos finalizada.
- Inicio de eliminatorias.
- Eliminatorias en curso.
- Mundial finalizado.

No se usara Mockoon en esta etapa.

La aplicacion debe mostrar de forma visible cuando simulation mode esta activo.
