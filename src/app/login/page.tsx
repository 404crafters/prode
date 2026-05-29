import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Mundial 2026</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Prode de la oficina</h1>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
