# Deploy Docker

## Archivos

- `Dockerfile`: build multi-stage. La app corre con `output: "standalone"` de Next.js.
- `docker-compose.yml`: levanta Traefik, la app y servicios operativos para migrar/sincronizar.
- `.env.production.example`: plantilla de variables para el server.

## Primer deploy

1. Apuntar el DNS del dominio al server.
2. En el server, instalar Docker y Docker Compose.
3. Copiar el repo o hacer `git clone`.
4. Crear `.env.production` desde `.env.production.example`.
5. Completar:
   - `APP_DOMAIN`
   - `TRAEFIK_ACME_EMAIL`
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `CRON_SECRET`
   - `FOOTBALL_DATA_API_TOKEN`
6. Ejecutar migraciones:

```bash
docker compose --env-file .env.production --profile ops run --rm migrate
```

7. Cargar fixture real:

```bash
docker compose --env-file .env.production --profile ops run --rm sync-once
```

8. Levantar la app:

```bash
docker compose --env-file .env.production up -d --build app traefik
```

9. Entrar con `admin` / `admin`, cambiar password y crear usuarios.

## Deploys posteriores

```bash
git pull
docker compose --env-file .env.production --profile ops run --rm migrate
docker compose --env-file .env.production up -d --build app
```

Si hay cambios que dependen de datos nuevos del fixture:

```bash
docker compose --env-file .env.production --profile ops run --rm sync-once
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
0 * * * * curl -fsS -H "Authorization: Bearer TU_CRON_SECRET" https://prode.example.com/api/cron/sync >/dev/null
```

Para dias con partidos, se puede bajar temporalmente a cada 30 minutos si el cupo de football-data.org lo permite:

```cron
*/30 * * * * curl -fsS -H "Authorization: Bearer TU_CRON_SECRET" https://prode.example.com/api/cron/sync >/dev/null
```

## Comandos utiles

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f app
docker compose --env-file .env.production logs -f traefik
docker compose --env-file .env.production --profile ops run --rm migrate
docker compose --env-file .env.production --profile ops run --rm sync-once
docker compose --env-file .env.production up -d --build app traefik
```
