import type { AgendaConfig, Pipeline, Stage } from "@/lib/types";

/* ---------------------------------------------------------------
 * Perguntas do formulário (as mesmas do formulário do Notion)
 * ------------------------------------------------------------- */

/** "Sua idade" (mesmas opções do Notion). */
export const AGE_OPTIONS: string[] = [
  "16 anos - Jovem Aprendiz",
  "17 anos - Jovem Aprendiz",
  ...Array.from({ length: 32 }, (_, i) => `${18 + i} anos`),
  "+50 anos",
];

/** "Como encontrou essa vaga?" (pode marcar mais de uma). */
export const SOURCE_OPTIONS: string[] = [
  "Anúncio no instagram",
  "Anúncio no Linkedin",
  "Anúncio no facebook",
  "Grupos de vagas",
  "Indicação de amigo(a)",
  "Site oficial da empresa",
  "Pesquisa pelo Google",
  "Sites de vagas de trabalho",
];

/** Opção de candidatura sem vaga específica (só no funil de Trabalho). */
export const TALENT_POOL = "Banco de Talentos";

/** A Vercel recusa envios acima de 4,5 MB; 4 MB deixa folga para os outros campos. */
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;
export const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
};
export const RESUME_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

/* ---------------------------------------------------------------
 * Etapas dos funis (mesmos status usados hoje no Notion)
 * ------------------------------------------------------------- */

export interface StageDef {
  key: Stage;
  label: string;
  /** Cor do marcador (classes Tailwind) */
  dot: string;
  /** Etapa final ou paralela: fica fora do fluxo principal do quadro */
  side?: boolean;
  /** Peso de avanço no processo (0 a 1), usado na chance de contratação */
  progress: number;
}

const S = (key: Stage, label: string, dot: string, progress: number, side = false): StageDef => ({ key, label, dot, progress, side });

export const STAGES: Record<Pipeline, StageDef[]> = {
  trabalho: [
    S("novo", "Não avaliado", "bg-slate-400", 0),
    S("avaliado_ia", "Avaliado por IA", "bg-sky-500", 0.1),
    S("convite", "Convite enviado", "bg-indigo-500", 0.25),
    S("entrevista", "Entrevista agendada", "bg-violet-500", 0.4),
    S("entrevistado", "Entrevista realizada", "bg-fuchsia-500", 0.55),
    S("onboarding", "Onboarding", "bg-amber-500", 0.75),
    S("treinamento", "Treinamento", "bg-orange-500", 0.85),
    S("contratado", "Contratado", "bg-emerald-500", 1, true),
    S("depois", "Possivelmente depois", "bg-yellow-500", 0.15, true),
    S("reprovado", "Reprovado", "bg-rose-500", 0, true),
    S("desligado", "Desligado", "bg-zinc-500", 0, true),
  ],
  professor: [
    S("novo", "Não avaliado", "bg-slate-400", 0),
    S("visto", "Visto", "bg-cyan-500", 0.05),
    S("avaliado_ia", "Avaliado por IA", "bg-sky-500", 0.1),
    S("convite", "Convite enviado", "bg-indigo-500", 0.25),
    S("entrevista", "Entrevista / aula-teste agendada", "bg-violet-500", 0.45),
    S("entrevistado", "Entrevista realizada", "bg-fuchsia-500", 0.65),
    S("contratado", "Contratado", "bg-emerald-500", 1, true),
    S("proximo_ano", "Banco para o próximo ano", "bg-yellow-500", 0.2, true),
    S("reprovado", "Reprovado", "bg-rose-500", 0, true),
  ],
};

export const PIPELINE_LABEL: Record<Pipeline, string> = {
  trabalho: "Trabalho",
  professor: "Professores",
};

export function stageDef(pipeline: Pipeline, stage: string): StageDef {
  const other: Pipeline = pipeline === "trabalho" ? "professor" : "trabalho";
  return (
    STAGES[pipeline].find((s) => s.key === stage) ??
    STAGES[other].find((s) => s.key === stage) ??
    STAGES[pipeline][0]
  );
}

export const stageLabel = (pipeline: Pipeline, stage: string) => stageDef(pipeline, stage).label;

/** Etapas em que a pessoa ainda está no processo (nem contratada, nem reprovada). */
export const ACTIVE_STAGES: Stage[] = ["novo", "visto", "avaliado_ia", "convite", "entrevista", "entrevistado", "onboarding", "treinamento"];
export const isActive = (stage: string) => (ACTIVE_STAGES as string[]).includes(stage);

/** Motivos de reprovação (os mesmos do Notion). */
export const REJECTION_REASONS: Record<Pipeline, string[]> = {
  trabalho: [
    "Sem motivo",
    "Na avaliação de perfil",
    "Não compareceu na entrevista",
    "Na entrevista (scorecard)",
    "Localização",
    "Falta de resposta",
    "No onboarding",
    "No treinamento",
    "Pertence ao funil de professores",
  ],
  professor: [
    "Sem motivo",
    "Na avaliação de perfil",
    "Não compareceu na entrevista",
    "Na entrevista / aula-teste",
    "Localização",
    "Falta de resposta",
    "Pertence ao funil de trabalho",
  ],
};

/** Critérios do scorecard da entrevista (0 a 10), iguais ao Notion. */
export const INTERVIEW_CRITERIA = [
  { key: "score_fit", label: "Fit Cultural" },
  { key: "score_proatividade", label: "Proatividade" },
  { key: "score_comunicacao", label: "Comunicação" },
  { key: "score_resiliencia", label: "Resiliência" },
  { key: "score_tecnica", label: "Técnica" },
] as const;

export type InterviewCriterionKey = (typeof INTERVIEW_CRITERIA)[number]["key"];

export const RECOMMENDATION_LABEL = {
  avancar: "Avançar",
  talvez: "Talvez",
  nao_avancar: "Não avançar",
} as const;

/* ---------------------------------------------------------------
 * Agenda
 * ------------------------------------------------------------- */

export const DEFAULT_AGENDA: AgendaConfig = {
  slot_minutes: 30,
  min_notice_hours: 12,
  horizon_days: 21,
  weekly: {
    "1": [["08:30", "11:30"], ["14:00", "17:00"]],
    "2": [["08:30", "11:30"], ["14:00", "17:00"]],
    "3": [["08:30", "11:30"], ["14:00", "17:00"]],
    "4": [["08:30", "11:30"], ["14:00", "17:00"]],
    "5": [["08:30", "11:30"], ["14:00", "17:00"]],
  },
  blocked_dates: [],
  location: "Praça Presidente Getúlio Vargas, 1119 – Caruaru-PE (Prédio de 5 andares)",
  instructions: "Chegue com 10 minutos de antecedência e traga um documento com foto.",
};

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** WhatsApp em formato de link (wa.me), assumindo Brasil quando faltar o 55. */
export function whatsappLink(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = "55" + digits;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
