"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type MainNavItem = {
  href: string;
  label: string;
  activePathPrefixes?: string[];
};

export function MainNav({ items }: { items: MainNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition-colors",
              isActive
                ? "border-emerald-400 bg-emerald-400 text-slate-950"
                : "border-slate-700 bg-slate-900/85 text-slate-200 hover:border-emerald-400 hover:bg-emerald-950/70 hover:text-emerald-100",
            ].join(" ")}
            href={item.href}
            key={item.href}
            prefetch={false}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isNavItemActive(pathname: string, item: MainNavItem) {
  const activePaths = [item.href, ...(item.activePathPrefixes ?? [])];

  return activePaths.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  });
}
