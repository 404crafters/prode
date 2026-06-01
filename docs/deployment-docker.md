# Deploy Docker

## Archivos

- `Dockerfile`: build multi-stage. La app corre con `output: "standalone"` de Next.js.
- La imagen base usa Node 20.19.x porque dependencias del build requieren `^20.19.0`.
- `docker-compose.yml`: levanta Traefik, la app y servicios operativos para migrar/sincronizar. Compatible con `docker-compose` v1.
- `.env.production.example`: plantilla de variables para el server. Copiarla como `.env`.

## Primer deploy

1. Apuntar el DNS del dominio al server.
2. En el server, instalar Docker Engine y `docker-compose`.
3. Copiar el repo o hacer `git clone`.
4. Crear `.env` desde `.env.production.example`.
5. Completar:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `CRON_SECRET`
   - `FOOTBALL_DATA_API_TOKEN`
6. Ejecutar migraciones:

```bash
docker-compose run --rm migrate
```

7. Cargar fixture real:

```bash
docker-compose run --rm sync-once
```

8. Levantar la app:

```bash
docker-compose up -d --build app traefik
```

9. Entrar con `admin` / `admin`, cambiar password y crear usuarios.

## Deploys posteriores

```bash
git pull
docker-compose run --rm migrate
docker-compose up -d --build app
```

Si hay cambios que dependen de datos nuevos del fixture:

```bash
docker-compose run --rm sync-once
```

Como el archivo se llama `.env`, Compose lo lee automaticamente:

```bash
docker-compose run --rm migrate
docker-compose run --rm sync-once
docker-compose up -d --build app traefik
```

Esta configuracion evita features de Compose v2 y usa tags de imagenes mas conservadores para mejorar compatibilidad con `docker-compose` v1.

Si el server tiene un Docker daemon viejo y aparece un error como:

```txt
client version 1.52 is too new. Maximum supported API version is 1.40
```

ejecutar los comandos forzando la version de API y apagando BuildKit:

```bash
sudo env DOCKER_API_VERSION=1.40 DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose up -d --build app traefik
```

Para migraciones/sync:

```bash
sudo env DOCKER_API_VERSION=1.40 DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose run --rm migrate
sudo env DOCKER_API_VERSION=1.40 DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose run --rm sync-once
```

## Cron recomendado

Conviene usar cron del host pegándole al endpoint HTTP protegido, no `docker exec`.

Ventajas:

- Usa el mismo camino que el boton de admin y el viejo cron de Vercel.
- No necesita incluir tooling de desarrollo en el container runtime.
- Sigue funcionando aunque el container se recree, mientras el dominio responda.
- El secreto queda en el host y el endpoint valida `CRON_SECRET`.

Ejemplo hourly en el host:

```cron
0 * * * * curl -fsS -H "Authorization: Bearer TU_CRON_SECRET" https://prode.404crafters.com/api/cron/sync >/dev/null
```

Para dias con partidos, se puede bajar temporalmente a cada 30 minutos si el cupo de football-data.org lo permite:

```cron
*/30 * * * * curl -fsS -H "Authorization: Bearer TU_CRON_SECRET" https://prode.404crafters.com/api/cron/sync >/dev/null
```

## Comandos utiles

```bash
docker-compose ps
docker-compose logs -f app
docker-compose logs -f traefik
docker-compose run --rm migrate
docker-compose run --rm sync-once
docker-compose up -d --build app traefik
```
