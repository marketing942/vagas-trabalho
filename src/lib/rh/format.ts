import type { Application } from "@/lib/types";
import { isActive, stageDef } from "./constants";

/** Fuso de Caruaru (sem horário de verão). */
export const TZ = "America/Recife";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, ...opts });
const DATE = fmt({ day: "2-digit", month: "2-digit", year: "numeric" });
const DATE_TIME = fmt({ day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const TIME = fmt({ hour: "2-digit", minute: "2-digit" });
const LONG_DAY = fmt({ weekday: "long", day: "numeric", month: "long" });

export const formatDate = (iso: string) => DATE.format(new Date(iso));
export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso));
export const formatTime = (iso: string) => TIME.format(new Date(iso));
/** "Quinta-feira, 12 de novembro" (só a primeira letra maiúscula) */
export const formatLongDay = (iso: string) => {
  const s = LONG_DAY.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "há 3 dias", "hoje" */
export function since(iso: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}

/** Transforma o que a pessoa escreveu (link, @usuario) em um link clicável, quando dá. */
export function socialHref(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^@[\w.]+$/.test(v)) return `https://instagram.com/${v.slice(1)}`;
  if (/^(www\.)?(instagram\.com|linkedin\.com|br\.linkedin\.com)\//i.test(v)) return `https://${v}`;
  return null;
}

/** Cor do selo do score da IA (0 a 100). */
export function aiScoreTone(score: number | null): string {
  if (score == null) return "bg-brand-100 text-brand-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 65) return "bg-sky-100 text-sky-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

/**
 * Chance de contratação (estimativa de 0 a 100) de quem ainda está no processo.
 * Combina a qualidade do perfil (score da IA e nota da entrevista, quando houver)
 * com o quanto a pessoa já avançou no funil. Não é uma probabilidade estatística:
 * serve para ordenar quem merece atenção primeiro.
 */
export function hireChance(app: Pick<Application, "pipeline" | "stage" | "ai_score" | "interview_score">): number | null {
  if (!isActive(app.stage)) return null;
  const ai = app.ai_score != null ? app.ai_score / 100 : null;
  const interview = app.interview_score != null && app.interview_score > 0 ? Number(app.interview_score) / 10 : null;
  let quality = 0.5; // sem nenhuma avaliação ainda
  if (ai != null && interview != null) quality = 0.4 * ai + 0.6 * interview;
  else if (ai != null) quality = ai;
  else if (interview != null) quality = interview;
  const progress = Math.min(1, stageDef(app.pipeline, app.stage).progress / 0.85);
  return Math.round(100 * (0.55 * quality + 0.45 * progress));
}
