<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project workflow

- Keep `docs/live-backlog.md` updated as the source of truth for current progress and remaining work.
- Before starting a new implementation batch, read `docs/live-backlog.md`.
- When completing or adding tasks, update `docs/live-backlog.md` in the same turn.
- Do not rely on `rg`; this environment does not have it. Use PowerShell `Get-ChildItem -Recurse` and `Select-String`.
- Prefer keeping changes aligned with the existing stack: Next.js App Router, TypeScript, Supabase Postgres, Drizzle, Tailwind.
