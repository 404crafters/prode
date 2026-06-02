import { redirect } from "next/navigation";
import { logoutAction } from "@/app/logout/actions";
import { MainNav, type MainNavItem } from "@/components/layout/main-nav";
import { getCurrentUser } from "@/lib/auth";

type NavItem = MainNavItem & {
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/fixture", label: "Fixture", activePathPrefixes: ["/matches"] },
  { href: "/agenda", label: "Agenda" },
  { href: "/grupos", label: "Grupos", activePathPrefixes: ["/groups"] },
  { href: "/especiales", label: "Especiales", activePathPrefixes: ["/specials"] },
  { href: "/ranking", label: "Ranking" },
  { href: "/reglamento", label: "Reglamento" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="app-bg min-h-screen text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-8 py-8">
        <header className="surface flex items-center justify-between rounded-lg px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500 text-lg font-black text-slate-950 shadow-lg shadow-emerald-950/30">
              404
            </div>
            <div>
              <p className="eyebrow">Mundial 2026</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">Prode de 404</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-200 shadow-sm">
              {user.displayName}
            </span>
            <form action={logoutAction}>
              <button
                className="rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
                type="submit"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <MainNav items={navItems.filter((item) => !item.adminOnly || user.role === "admin")} />

        {children}
      </div>
    </main>
  );
}
