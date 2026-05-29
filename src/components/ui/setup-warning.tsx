export function SetupWarning({ error }: { error?: unknown }) {
  const message = error instanceof Error ? error.message : "No se pudo leer la base de datos.";

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <h2 className="text-lg font-semibold">Falta configurar Supabase</h2>
      <p className="mt-2 text-sm leading-6">
        Para ver datos reales, crea `C:\404\prode\.env.local` con `DATABASE_URL` y corre las
        migraciones/seeds. Error actual: {message}
      </p>
    </section>
  );
}
