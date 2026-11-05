import type { Metadata } from "next";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import BookingClient from "@/components/agenda/BookingClient";
import { getSettings } from "@/lib/settings";
import { getOpenJobs } from "@/lib/jobs";
import { availableDays } from "@/lib/rh/agenda";
import { bookingContext } from "@/lib/rh/booking";
import { createServiceClient, HAS_SERVICE_ROLE } from "@/lib/supabase/service";

// Horários livres mudam a todo momento: nada de cache
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agendar entrevista | Carreiras CPPEM",
  description: "Escolha o dia e o horário da sua entrevista no CPPEM.",
  robots: { index: false, follow: false },
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [settings, params] = await Promise.all([getSettings(), searchParams]);
  const ctx = HAS_SERVICE_ROLE ? await bookingContext(createServiceClient(), params.c) : null;
  const jobs = ctx && !params.c ? await getOpenJobs() : [];

  return (
    <>
      {/* Página de foco: sem menu nem links para fora, só as marcas */}
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-[64px] max-w-3xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo variant="cppem" className="-my-1 h-11 sm:h-14" />
            <span className="h-8 w-px bg-line" aria-hidden />
            <Logo variant="colegio" className="-my-1 h-11 sm:h-14" />
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 py-10 text-white sm:py-14">
          <div className="container-page max-w-3xl">
            <p className="font-eyebrow text-sm font-bold uppercase tracking-[0.2em] text-accent-300">Entrevista</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">
              {ctx?.firstName ? `${ctx.firstName}, escolha o seu horário` : "Agende a sua entrevista"}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-brand-100">
              {ctx?.app ? `Processo seletivo: ${ctx.app.job_title}.` : "Escolha o dia e o horário que ficam melhores para você."}
            </p>
          </div>
        </div>
        <div className="container-page max-w-3xl pb-20 pt-8">
          {!ctx ? (
            <p className="card p-8 text-center text-inksoft">O agendamento ainda não está disponível. Fale com o RH do CPPEM.</p>
          ) : params.c && !ctx.app ? (
            <p className="card p-8 text-center text-inksoft">Este link de agendamento não é válido. Fale com o RH do CPPEM pelo WhatsApp.</p>
          ) : (
            <BookingClient
              token={params.c ?? null}
              days={availableDays(ctx.cfg, ctx.busy)}
              upcoming={ctx.upcoming}
              location={ctx.cfg.location}
              instructions={ctx.cfg.instructions}
              mapsUrl={settings.maps_url}
              jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
            />
          )}
        </div>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-inkmuted">
        Dúvidas sobre a entrevista? Fale com o RH do CPPEM pelo WhatsApp que entrou em contato com você.
      </footer>
    </>
  );
}
