import type { AgendaConfig, Application, AppStatus, InterviewScript, JobRef, Pipeline, Stage } from "@/lib/types";

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
    S("depois", "Possivelmente depois", "bg-yellow-500", 0.15, true),
  ],
  professor: [
    S("novo", "Não avaliado", "bg-slate-400", 0),
    S("visto", "Visto", "bg-cyan-500", 0.05),
    S("avaliado_ia", "Avaliado por IA", "bg-sky-500", 0.1),
    S("convite", "Convite enviado", "bg-indigo-500", 0.25),
    S("entrevista", "Entrevista / aula-teste agendada", "bg-violet-500", 0.45),
    S("entrevistado", "Entrevista realizada", "bg-fuchsia-500", 0.65),
    S("proximo_ano", "Banco para o próximo ano", "bg-yellow-500", 0.2, true),
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

/** Resultado da candidatura: fica fora das etapas, como "ganho" e "perdido" num CRM. */
export const STATUS: Record<AppStatus, { label: string; tone: string; dot: string }> = {
  em_processo: { label: "Em processo", tone: "bg-brand-50 text-brand-700 ring-brand-100", dot: "bg-brand-400" },
  contratado: { label: "Contratado", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  reprovado: { label: "Reprovado", tone: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500" },
  desligado: { label: "Desligado", tone: "bg-zinc-100 text-zinc-700 ring-zinc-200", dot: "bg-zinc-500" },
};

/** Ainda no processo seletivo (nem contratado, nem reprovado, nem desligado). */
export const isOpen = (app: Pick<Application, "status">) => app.status === "em_processo";

/** Vagas do card (com fallback para a vaga principal em dados antigos). */
export function jobsOf(app: Pick<Application, "jobs" | "job_id" | "job_title">): JobRef[] {
  return Array.isArray(app.jobs) && app.jobs.length ? app.jobs : [{ id: app.job_id, title: app.job_title }];
}
export const jobTitles = (app: Pick<Application, "jobs" | "job_id" | "job_title">) => jobsOf(app).map((j) => j.title);

/** Motivos de reprovação padrão (o RH edita a lista em Configurações). */
export const DEFAULT_REJECTION_REASONS = [
  "Na avaliação de perfil",
  "Não compareceu na entrevista",
  "Na entrevista (scorecard)",
  "Na aula-teste",
  "Localização",
  "Falta de resposta",
  "Desistiu do processo",
  "No onboarding",
  "No treinamento",
  "Pertence ao outro funil",
  "Outro motivo",
];

/** Roteiro de entrevista padrão do CPPEM (o RH edita em Configurações). */
export const DEFAULT_INTERVIEW_SCRIPT: InterviewScript = {
  sections: [
    {
      title: "Apresentação",
      questions: [
        { q: "Como é a sua rotina do início ao fim do dia?", hint: "Demonstra proatividade" },
        { q: "Quais os seus princípios de vida?", hint: "Demonstra fit cultural" },
        { q: "Descreva o ambiente de trabalho em que você seria mais produtivo e feliz", hint: "Demonstra fit cultural" },
        { q: "Como você se deslocaria até aqui todos os dias?", hint: "Demonstra disponibilidade" },
        { q: "Você tem filhos?", hint: "Demonstra responsabilidade e prioridades" },
      ],
    },
    {
      title: "Competências técnicas",
      questions: [
        { q: "Qual é a sua experiência na área?", hint: "Demonstra competência técnica" },
        { q: "Qual foi o seu último emprego e por que saiu de lá?", hint: "Demonstra respeito e perfil profissional" },
      ],
    },
    {
      title: "Competências comportamentais",
      questions: [
        { q: "Qual foi o melhor líder que você já teve? O que aprendeu com ele?", hint: "Demonstra respeito e o que desperta admiração ou detração" },
        { q: "Você se considera um líder?", hint: "" },
        { q: "Qual foi o maior desafio que você já enfrentou na vida?", hint: "Demonstra resiliência ou fraqueza" },
        { q: "O que faria você deixar o emprego imediatamente?", hint: "Demonstra instabilidades emocionais" },
        { q: "O que você considera sua maior qualidade?", hint: "Demonstra resiliência ou fraqueza · Demonstra humildade" },
        { q: "O que você considera que mais tem que melhorar?", hint: "Demonstra humildade" },
        { q: "Qual sua principal motivação?", hint: "Demonstra visão de futuro" },
        { q: "Onde você se vê nos próximos anos?", hint: "Demonstra visão de futuro" },
      ],
    },
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
