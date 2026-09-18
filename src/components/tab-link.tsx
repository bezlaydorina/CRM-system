"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";

export function TabLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={clsx(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
        active ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-800"
      )}
    >
      {children}
    </Link>
  );
}
