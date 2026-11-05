"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
    {d}
  </svg>
);

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: svg(<><rect x="3.5" y="3.5" width="7" height="8" rx="2" /><rect x="13.5" y="3.5" width="7" height="5" rx="2" /><rect x="13.5" y="11.5" width="7" height="9" rx="2" /><rect x="3.5" y="14.5" width="7" height="6" rx="2" /></>) },
  { href: "/admin/candidatos", label: "Candidatos", icon: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20v-1a5 5 0 0 0-3.5-4.8" /></>) },
  { href: "/admin/candidatos/finalizados", label: "Finalizados", icon: svg(<><path d="M9 11.5 11.5 14 16 9" /><rect x="3.5" y="3.5" width="17" height="17" rx="4" /></>) },
  { href: "/admin/agenda", label: "Agenda", icon: svg(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>) },
  { href: "/admin/vagas", label: "Vagas", icon: svg(<><rect x="3" y="7.5" width="18" height="12" rx="2.5" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18" /></>) },
  { href: "/admin/configuracoes", label: "Configurações", icon: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>) },
];

/** Layout base da área administrativa com navegação lateral. */
export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  /** Linha de contexto abaixo do título */
  subtitle?: string;
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
    <div className="min-h-screen bg-[#f4f6fb]">
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
              // Item mais específico que casa com a página (Finalizados fica dentro de Candidatos)
              const best = NAV.filter((n) => pathname.startsWith(n.href)).sort((a, b) => b.href.length - a.href.length)[0];
              const active = best?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white before:absolute before:-left-3 before:top-2 before:h-[calc(100%-16px)] before:w-1 before:rounded-r-full before:bg-accent-400"
                      : "text-brand-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 px-3">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-200 transition-colors hover:bg-white/5 hover:text-white"
            >
              {svg(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="m10 17-5-5 5-5M5 12h11" /></>)} Sair
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-white px-4 py-5 sm:px-6">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-brand-950 sm:text-2xl">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-brand-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          <div className="min-w-0 p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
