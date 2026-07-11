"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/clients", label: "Brokers" },
  { href: "/buyers", label: "Buyers" },
  { href: "/price-sheet", label: "Price Sheet" },
  { href: "/catalog", label: "Catalog" },
  { href: "/margins", label: "Margins" },
  { href: "/media", label: "Media" },
  { href: "/restock", label: "Restock" },
  { href: "/", label: "Calculator" },
  { href: "/how-to", label: "How to use" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <div className="no-print sticky top-0 z-30 -mx-4 mb-6 border-b border-neutral-200/70 bg-neutral-100/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-neutral-100/60 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="hidden shrink-0 items-center gap-2 sm:flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Aura
          </span>
        </Link>

        <nav className="scroll-fade -mx-1 flex flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm"
                    : "shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-white hover:text-neutral-900"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
