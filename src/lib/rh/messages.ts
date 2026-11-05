import { jobTitles } from "./constants";
import { formatLongDay, formatTime } from "./format";
import type { Application, Candidate, MessageTemplate } from "@/lib/types";

export interface MessageContext {
  candidate: Pick<Candidate, "full_name">;
  app: Pick<Application, "jobs" | "job_id" | "job_title" | "booking_token">;
  origin: string;
  /** Próxima entrevista marcada, se houver */
  interviewAt?: string | null;
  location?: string | null;
}

/** "a vaga X" / "as vagas X e Y" */
export function vagasText(app: Pick<Application, "jobs" | "job_id" | "job_title">) {
  const t = jobTitles(app);
  return t.length > 1 ? `as vagas ${t.slice(0, -1).join(", ")} e ${t[t.length - 1]}` : `a vaga ${t[0]}`;
}

/** Troca as variáveis do modelo pelos dados da pessoa. */
export function renderMessage(text: string, ctx: MessageContext): string {
  const when = ctx.interviewAt ? `${formatLongDay(ctx.interviewAt).toLowerCase()}, às ${formatTime(ctx.interviewAt)}` : "(data a combinar)";
  const vars: Record<string, string> = {
    primeiro_nome: ctx.candidate.full_name.split(" ")[0],
    nome: ctx.candidate.full_name,
    vagas: vagasText(ctx.app),
    link_agenda: `${ctx.origin}/agenda?c=${ctx.app.booking_token}`,
    data_entrevista: when,
    local: ctx.location || "no CPPEM",
  };
  return text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

/** Modelo pela chave (com fallback). */
export const templateOf = (list: MessageTemplate[], key: string) => list.find((t) => t.key === key) ?? null;

/** Qual devolutiva usar: depois de entrevista, a mais pessoal. */
export const feedbackKey = (stage: string) => (["entrevista", "entrevistado", "onboarding", "treinamento"].includes(stage) ? "devolutiva_entrevista" : "devolutiva");
