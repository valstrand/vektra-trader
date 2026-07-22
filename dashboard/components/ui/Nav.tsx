"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Penger" },
  { href: "/agenter", label: "Agenter" },
  { href: "/logg", label: "Logg" },
  { href: "/admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 order-last border-t border-border bg-surface/90 backdrop-blur sm:top-0 sm:bottom-auto sm:order-first sm:border-b sm:border-t-0">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4">
        <span className="hidden py-3 font-semibold tracking-tight sm:block">
          Vektra<span className="text-accent">.</span>
        </span>
        <ul className="flex w-full justify-around sm:w-auto sm:gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block px-4 py-3 text-sm transition-colors ${
                    active ? "text-accent" : "text-muted hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
