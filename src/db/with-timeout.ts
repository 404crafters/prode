// Hard ceiling for any single database operation. On serverless (Vercel) a
// pooled TCP connection can be reused after the instance was frozen/thawed and
// silently dropped by the pooler; a query written into that dead socket never
// gets a reply and would otherwise hang until the platform kills the function
// (the 300s FUNCTION_INVOCATION_TIMEOUT). The same happens against a paused
// Supabase project. This wrapper converts that infinite hang into a fast,
// explicit error so pages can fall back instead of timing out.
const DEFAULT_DB_TIMEOUT_MS = 8000;

export class DbTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(
      `Database operation "${label}" timed out after ${ms}ms. ` +
        `The database may be unreachable, paused, or a serverless connection went stale.`,
    );
    this.name = "DbTimeoutError";
  }
}

export function withDbTimeout<T>(
  operation: PromiseLike<T>,
  label = "query",
  ms = DEFAULT_DB_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new DbTimeoutError(label, ms)), ms);
    // Promise.resolve adopts Drizzle's thenable query builders as well as a
    // plain Promise.all(...) of several of them.
    Promise.resolve(operation).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
