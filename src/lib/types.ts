export type JobCategory = "trabalho" | "professor";
export type JobStatus = "aberta" | "encerrada" | "pausada" | "rascunho";
export type WorkType =
  | "presencial"
  | "hibrido"
  | "home_office"
  | "terceirizado";

export interface Job {
  id: string;
  title: string;
  slug: string;
  category: JobCategory;
  department: string | null;
  discipline: string | null;
  segment: string | null;
  work_type: WorkType | null;
  unit: string | null;
  location: string;
  expected_schedule: string | null;
  status: JobStatus;
  short_description: string | null;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  differentials: string | null;
  benefits: string | null;
  // Link de candidatura específico desta vaga (opcional).
  // Quando vazio, usa o link geral em site_settings.form_url.
  apply_url: string | null;
  // Vaga em destaque: aparece primeiro na listagem pública.
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export type JobInput = Omit<Job, "id" | "created_at" | "updated_at">;

/** Item de conteúdo editável no admin (cards, etapas do processo, perguntas). */
export interface ContentItem {
  title: string;
  text: string;
  /** Ícone do card (só usado em "Por que trabalhar no CPPEM"). */
  icon?: string;
}

export interface SiteSettings {
  id: string;
  company_name: string;
  about_text: string | null;
  stat_years: string | null;
  stat_students: string | null;
  stat_team: string | null;
  stat_extra: string | null;
  form_url: string;
  // Linktree de cada marca (reúne todas as redes sociais)
  linktree_cppem_url: string | null;
  linktree_colegio_url: string | null;
  linktree_unicive_url: string | null;
  // LinkedIn é único para o grupo
  linkedin_url: string | null;
  // Listas configuráveis (setores e unidades), gerenciadas no admin
  departments: string[] | null;
  units: string[] | null;
  // Grupo de WhatsApp para anúncios de vagas
  whatsapp_group_url: string | null;
  address: string | null;
  cnpj: string | null;
  maps_url: string | null;
  footer_description: string | null;
  // E-mail para solicitações de privacidade (aparece na Política de Privacidade)
  privacy_email: string | null;
  // Textos editáveis das seções da página. Vazio (null) = usa o texto padrão.
  why_items: ContentItem[] | null;
  process_steps: ContentItem[] | null;
  faq_items: ContentItem[] | null;
  /** Formulário próprio ligado: os botões "Candidatar-se" abrem /candidatura em vez do Notion. */
  applications_enabled: boolean;
  /** Avaliar automaticamente com IA cada candidatura nova. */
  ai_auto_evaluate: boolean;
  /** Disponibilidade para entrevistas (link de agendamento). */
  agenda_config: AgendaConfig | null;
  created_at: string;
  updated_at: string;
}

/* ---------------------------------------------------------------
 * RH: candidatos, candidaturas, entrevistas
 * ------------------------------------------------------------- */

export type Pipeline = "trabalho" | "professor";

export type Stage =
  | "novo"
  | "visto"
  | "avaliado_ia"
  | "convite"
  | "entrevista"
  | "entrevistado"
  | "onboarding"
  | "treinamento"
  | "depois"
  | "proximo_ano";

/** Resultado da candidatura (como "ganho" e "perdido" num CRM). */
export type AppStatus = "em_processo" | "contratado" | "reprovado" | "desligado";

/** Uma vaga do card (id vazio = Banco de Talentos ou vaga que não está mais no site). */
export interface JobRef {
  id: string | null;
  title: string;
}

/** Roteiro de entrevista. No card, cada pergunta também guarda a resposta. */
export interface InterviewQuestion {
  q: string;
  hint?: string;
  answer?: string;
}
export interface InterviewScript {
  sections: { title: string; questions: InterviewQuestion[] }[];
}

/** Configurações privadas do RH (tabela rh_settings, só o admin lê). */
export interface RhSettings {
  rejection_reasons: string[];
  interview_script: InterviewScript;
}

export type AiStatus = "pendente" | "avaliando" | "concluida" | "erro" | "sem_ia";

export interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string;
  whatsapp_digits: string;
  social_url: string | null;
  age_range: string | null;
  city: string | null;
  about: string | null;
  sources: string[];
  resume_path: string | null;
  resume_name: string | null;
  origin: "site" | "notion" | "admin" | "agenda";
  external_ref: string | null;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Um critério avaliado pela IA. */
export interface AiCriterion {
  criterio: string;
  nota: number; // 0 a 10
  evidencia: string;
}

/** Scorecard gerado pela IA (perfil x requisitos da vaga). */
export interface AiReport {
  score: number; // 0 a 100
  recomendacao: "avancar" | "talvez" | "nao_avancar";
  resumo: string;
  criterios: AiCriterion[];
  pontos_fortes: string[];
  pontos_de_atencao: string[];
  fit_cultural: { nota: number; comentario: string };
  /** Aderência a cada vaga escolhida (quando a pessoa marcou mais de uma) */
  vagas?: { vaga: string; score: number; comentario: string }[];
  perguntas_entrevista: string[];
  curriculo_lido: boolean;
}

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string | null;
  job_title: string;
  pipeline: Pipeline;
  stage: Stage;
  status: AppStatus;
  closed_at: string | null;
  /** Todas as vagas do card (a primeira é a principal: job_id / job_title) */
  jobs: JobRef[];
  interview_answers: InterviewScript | null;
  rejection_reason: string | null;
  ai_status: AiStatus;
  ai_score: number | null;
  ai_report: AiReport | null;
  ai_model: string | null;
  ai_evaluated_at: string | null;
  ai_error: string | null;
  score_fit: number | null;
  score_proatividade: number | null;
  score_comunicacao: number | null;
  score_resiliencia: number | null;
  score_tecnica: number | null;
  interview_score: number | null;
  notes: string | null;
  booking_token: string;
  stage_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  kind: "criada" | "etapa" | "status" | "avaliacao_ia" | "entrevista" | "nota" | "edicao";
  from_stage: string | null;
  to_stage: string | null;
  detail: string | null;
  actor: "admin" | "sistema" | "candidato" | "ia";
  created_at: string;
}

export type InterviewStatus = "agendada" | "realizada" | "faltou" | "cancelada";

export interface Interview {
  id: string;
  candidate_id: string;
  application_id: string | null;
  starts_at: string;
  ends_at: string;
  status: InterviewStatus;
  location: string | null;
  notes: string | null;
  created_via: "admin" | "link";
  created_at: string;
  updated_at: string;
}

/** Disponibilidade da agenda. Horários no fuso de Caruaru (UTC-3). */
export interface AgendaConfig {
  slot_minutes: number;
  min_notice_hours: number;
  horizon_days: number;
  /** Dia da semana (1 = segunda ... 6 = sábado, 0 = domingo) -> faixas ["08:30","11:30"] */
  weekly: Record<string, [string, string][]>;
  /** Datas sem entrevista (feriados etc.), formato AAAA-MM-DD */
  blocked_dates: string[];
  location: string;
  instructions: string;
}
