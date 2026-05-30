import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Partidos" },
  { href: "/groups", label: "Grupos" },
  { href: "/specials", label: "Especiales" },
  { href: "/ranking", label: "Ranking" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="app-bg min-h-screen text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-8 py-8">
        <header className="surface flex items-center justify-between rounded-lg px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-lg font-black text-white">
              404
            </div>
            <div>
              <p className="eyebrow">Mundial 2026</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">Prode de 404</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
              {user.displayName}
            </span>
            <Link
              className="rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
              href="/logout"
            >
              Salir
            </Link>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {navItems
            .filter((item) => !item.adminOnly || user.role === "admin")
            .map((item) => (
              <Link
                className="rounded-md border border-white/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
        </nav>

        {children}
      </div>
    </main>
  );
}
