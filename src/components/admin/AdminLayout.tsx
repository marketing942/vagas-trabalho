"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { SYSTEM_NAME } from "@/lib/constants";

const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
    {d}
  </svg>
);

const NAV = [
  { href: "/admin/dashboard", label: "Painel", icon: svg(<><rect x="3.5" y="3.5" width="7" height="8" rx="2" /><rect x="13.5" y="3.5" width="7" height="5" rx="2" /><rect x="13.5" y="11.5" width="7" height="9" rx="2" /><rect x="3.5" y="14.5" width="7" height="6" rx="2" /></>) },
  { href: "/admin/candidatos", label: "Candidatos", icon: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20v-1a5 5 0 0 0-3.5-4.8" /></>) },
  { href: "/admin/candidatos/finalizados", label: "Finalizados", icon: svg(<><path d="M9 11.5 11.5 14 16 9" /><rect x="3.5" y="3.5" width="17" height="17" rx="4" /></>) },
  { href: "/admin/relatorios", label: "Relatórios", icon: svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>) },
  { href: "/admin/agenda", label: "Agenda", icon: svg(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>) },
  { href: "/admin/vagas", label: "Vagas", icon: svg(<><rect x="3" y="7.5" width="18" height="12" rx="2.5" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18" /></>) },
  { href: "/admin/configuracoes", label: "Configurações", icon: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>) },
];

/** Grupos do menu lateral */
const GROUPS: { title: string; items: string[] }[] = [
  { title: "Recrutamento", items: ["/admin/dashboard", "/admin/candidatos", "/admin/candidatos/finalizados", "/admin/agenda"] },
  { title: "Gestão", items: ["/admin/vagas", "/admin/relatorios", "/admin/configuracoes"] },
];

/** Layout base da área administrativa (RH CPPEM) com navegação lateral. */
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
  const [email, setEmail] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  // Item mais específico que casa com a página (Finalizados fica dentro de Candidatos)
  const activeHref = NAV.filter((n) => pathname.startsWith(n.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="rh min-h-screen">
      {/* Topbar mobile */}
      <div className="flex items-center justify-between bg-brand-950 px-4 py-3 lg:hidden">
        <Wordmark />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white"
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside className={`${open ? "flex" : "hidden"} w-full shrink-0 flex-col bg-brand-950 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60`}>
          <div className="hidden px-5 pb-6 pt-5 lg:block">
            <Link href="/admin/dashboard" aria-label={`${SYSTEM_NAME}: início`}>
              <Wordmark />
            </Link>
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-3 lg:py-0" aria-label="Menu">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <p className="px-3 pb-1.5 text-[11px] font-medium text-brand-300/70">{g.title}</p>
                <ul className="space-y-px">
                  {g.items.map((href) => {
                    const item = NAV.find((n) => n.href === href)!;
                    const active = activeHref === href;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13.5px] transition-colors ${
                            active
                              ? "bg-white/[0.08] font-medium text-white before:absolute before:-left-3 before:inset-y-1.5 before:w-[3px] before:rounded-r before:bg-accent-400"
                              : "text-brand-200/90 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <span className={active ? "text-accent-300" : "text-brand-300/80"}>{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 px-3 py-3">
            {email && (
              <p className="truncate px-3 pb-1 text-xs text-brand-300/80" title={email}>
                {email}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={signOut}
                className="flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13.5px] text-brand-200/90 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {svg(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="m10 17-5-5 5-5M5 12h11" /></>)} Sair
              </button>
              <Link href="/carreiras" target="_blank" className="px-3 text-xs text-brand-300/80 hover:text-white">
                Página de vagas ↗
              </Link>
            </div>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 bg-white px-4 pb-4 pt-5 sm:px-8">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-brand-950">{title}</h1>
              {subtitle && <p className="mt-1 text-[13px] text-stone-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </header>
          <div className="min-w-0 p-4 sm:px-8 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Nome do sistema com o símbolo do CPPEM. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo className="h-8" />
      <span className="leading-none">
        <span className="block text-[15px] font-semibold tracking-tight text-white">
          RH <span className="text-accent-300">CPPEM</span>
        </span>
        <span className="mt-1 block text-[11px] text-brand-300/80">Recrutamento e seleção</span>
      </span>
    </span>
  );
}
