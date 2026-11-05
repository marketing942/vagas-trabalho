import type { Metadata } from "next";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import QuizClient from "@/components/questionario/QuizClient";
import { CULTURE_QUIZ } from "@/lib/rh/culture-quiz";
import { createServiceClient, HAS_SERVICE_ROLE } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Questionário de cultura | Carreiras CPPEM",
  description: "Algumas situações do dia a dia no CPPEM.",
  robots: { index: false, follow: false },
};

/** Questionário de cultura: link pessoal (o mesmo token do agendamento). */
export default async function QuestionarioPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  let state: "invalido" | "respondido" | "aberto" = "invalido";
  let firstName = "";
  if (HAS_SERVICE_ROLE && c && /^[0-9a-f]{32}$/.test(c)) {
    const { data } = await createServiceClient()
      .from("applications")
      .select("status, culture_quiz, candidates(full_name)")
      .eq("booking_token", c)
      .maybeSingle();
    if (data && data.status === "em_processo") {
      state = data.culture_quiz ? "respondido" : "aberto";
      firstName = ((data.candidates as unknown as { full_name: string } | null)?.full_name ?? "").split(" ")[0];
    }
  }
  // Só o texto das situações vai para o navegador; a pontuação fica no servidor
  const questions = CULTURE_QUIZ.map(({ id, situation, options }) => ({ id, situation, options }));

  return (
    <>
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
            <p className="font-eyebrow text-sm font-bold uppercase tracking-[0.2em] text-accent-300">Processo seletivo</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{firstName ? `${firstName}, como você agiria?` : "Como você agiria?"}</h1>
            <p className="mt-3 max-w-2xl text-lg text-brand-100">
              São {questions.length} situações do dia a dia no CPPEM. Escolha a alternativa mais parecida com o que você faria de verdade. Leva uns 5 minutos.
            </p>
          </div>
        </div>
        <div className="container-page max-w-3xl pb-20 pt-8">
          {state === "invalido" ? (
            <p className="card p-8 text-center text-inksoft">Este link não é válido ou o processo já foi encerrado. Fale com o RH do CPPEM pelo WhatsApp.</p>
          ) : state === "respondido" ? (
            <p className="card p-8 text-center text-inksoft">Você já respondeu este questionário. Obrigado! Nossa equipe vai falar com você pelo WhatsApp.</p>
          ) : (
            <QuizClient token={c!} questions={questions} />
          )}
        </div>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-inkmuted">
        Suas respostas são usadas só neste processo seletivo, conforme a Política de Privacidade do CPPEM.
      </footer>
    </>
  );
}
