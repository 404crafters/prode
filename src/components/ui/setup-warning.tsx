export function SetupWarning({ error }: { error?: unknown }) {
  const message = error instanceof Error ? error.message : "No se pudo leer la base de datos.";

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <h2 className="text-lg font-semibold">No se pudo leer la base de datos</h2>
    </section>
  );
}
