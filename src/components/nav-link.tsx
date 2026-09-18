"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";

export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-indigo-200 hover:bg-white/5 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}
