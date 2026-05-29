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
  { href: "/admin", label: "Admin", adminOnly: true },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-8 py-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-700">Mundial 2026</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Prode de la oficina</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700">
              {user.displayName}
            </span>
            <Link
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              href="/logout"
            >
              Salir
            </Link>
          </div>
        </header>

        <nav className="flex gap-2">
          {navItems
            .filter((item) => !item.adminOnly || user.role === "admin")
            .map((item) => (
              <Link
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
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
