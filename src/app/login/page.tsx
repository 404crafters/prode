import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#d1fae5,transparent_30rem),linear-gradient(180deg,#f8fafc,#eef2f7)] px-6 text-slate-950">
      <section className="w-full max-w-sm rounded-lg border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
        <p className="text-sm font-medium text-emerald-700">Mundial 2026</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Prode de 404</h1>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
