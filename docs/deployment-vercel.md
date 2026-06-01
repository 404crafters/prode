# Deploy Vercel

## Enfoque

La app se deploya en Vercel, pero el sync horario no usa Vercel Cron porque el plan Hobby limita la frecuencia. El sync se dispara desde un cron externo haciendo `curl` al endpoint protegido:

```txt
GET /api/cron/sync
Authorization: Bearer $CRON_SECRET
```

## Variables de entorno

Configurar en Vercel para Production:

```env
DATABASE_URL=postgres://...
SESSION_SECRET=...
CRON_SECRET=...
FOOTBALL_DATA_API_TOKEN=...
FOOTBALL_DATA_BASE_URL=https://api.football-data.org/v4
FOOTBALL_DATA_COMPETITION=WC
FOOTBALL_DATA_SEASON=2026
SIMULATION_MODE=false
```

No configurar `SIMULATION_NOW` en produccion.

## Primer deploy

1. Crear proyecto en Vercel conectado al repo.
2. Framework: Next.js.
3. Build command: default (`npm run build`).
4. Cargar env vars.
5. Deploy.
6. Correr migracion contra Supabase prod desde local o una terminal segura:

```bash
npm run db:migrate
```

7. Correr sync inicial contra Supabase prod:

```bash
npm run sync:football-data
```

8. Entrar con `admin` / `admin`, cambiar password y crear usuarios.

## Cron externo

En cualquier server que tenga `cron` y `curl`:

```cron
0 * * * * curl -fsS -H "Authorization: Bearer TU_CRON_SECRET" https://prode.404crafters.com/api/cron/sync >/dev/null 2>&1
```

En dias con partidos se puede usar cada 30 minutos si el cupo de football-data.org lo permite:

```cron
*/30 * * * * curl -fsS -H "Authorization: Bearer TU_CRON_SECRET" https://prode.404crafters.com/api/cron/sync >/dev/null 2>&1
```

## Deploys posteriores

Si no hay cambios de schema:

```bash
git push
```

Si hay cambios de schema:

```bash
npm run db:generate
npm run db:migrate
git push
```

La migracion a prod se corre manualmente y controlada. No se ejecuta como parte del build de Vercel.
