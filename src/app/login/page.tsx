import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="app-bg flex min-h-screen items-center justify-center px-6 text-slate-100">
      <section className="surface w-full max-w-sm rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-base font-black text-slate-950 shadow-lg shadow-emerald-950/30">
            404
          </div>
          <div>
            <p className="eyebrow">Mundial 2026</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Prode de 404</h1>
          </div>
        </div>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
