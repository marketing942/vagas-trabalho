"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/candidatos", label: "Candidatos", icon: "👥" },
  { href: "/admin/agenda", label: "Agenda", icon: "📅" },
  { href: "/admin/vagas", label: "Vagas", icon: "💼" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];

/** Layout base da área administrativa com navegação lateral. */
export default function AdminLayout({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  /** Botões à direita do título */
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Topbar mobile */}
      <div className="flex items-center justify-between border-b border-brand-100 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-brand-950">CPPEM Admin</span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm"
        >
          Menu
        </button>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } w-full shrink-0 border-r border-brand-100 bg-brand-950 lg:block lg:min-h-screen lg:w-64`}
        >
          <div className="px-6 py-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Logo className="h-8" />
              <span className="font-bold text-white">Admin</span>
            </Link>
          </div>
          <nav className="space-y-1 px-3">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-brand-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 px-3">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span aria-hidden>↩</span> Sair
            </button>
          </div>
          <div className="mt-6 px-6">
            <Link
              href="/carreiras"
              target="_blank"
              className="text-xs text-brand-400 hover:text-brand-200"
            >
              Ver página pública ↗
            </Link>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-white px-6 py-5">
            <h1 className="text-xl font-bold text-brand-950">{title}</h1>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          <div className="min-w-0 p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
