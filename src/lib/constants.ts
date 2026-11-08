import type { JobCategory, JobStatus, WorkType } from "./types";

export const DEPARTMENTS = [
  "Marketing",
  "Comercial",
  "Tecnologia",
  "Pedagógico",
  "Serviços Gerais",
  "Administrativo",
  "Financeiro",
] as const;

export const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
  { value: "home_office", label: "Home Office" },
  { value: "terceirizado", label: "Terceirizado" },
];

export const UNITS = [
  "CPPEM Concursos",
  "Colégio CPPEM",
  "Unicive Caruaru",
] as const;

export const DISCIPLINE_CATEGORIES = ["Polivalente", "de Disciplina"] as const;

export const CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: "trabalho", label: "Trabalho" },
  { value: "professor", label: "Professor" },
];

export const STATUSES: { value: JobStatus; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "encerrada", label: "Encerrada" },
  { value: "pausada", label: "Pausada" },
  { value: "rascunho", label: "Rascunho" },
];

export const DEFAULT_LOCATION = "Caruaru-PE";

/** Uma vaga pode ter mais de uma unidade, separadas por vírgula. */
export function parseUnits(unit?: string | null): string[] {
  if (!unit) return [];
  return unit
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

// Logos oficiais (originais dos brandbooks CPPEM e Colégio)
// Guardadas em /public/logos (versões reduzidas das originais: 480x480).
// Antes eram carregadas de um repositório externo do GitHub, o que deixava o
// site dependente dele e baixava arquivos de vários MB.
export const LOGO_CPPEM = "/logos/cppem.png";
export const LOGO_COLEGIO = "/logos/colegio.png";

export function workTypeLabel(value?: WorkType | null): string {
  return WORK_TYPES.find((w) => w.value === value)?.label ?? "";
}

export function statusLabel(value?: JobStatus | null): string {
  return STATUSES.find((s) => s.value === value)?.label ?? "";
}

export function categoryLabel(value?: JobCategory | null): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "";
}

export const STATUS_BADGE: Record<JobStatus, string> = {
  aberta: "bg-green-100 text-green-700",
  encerrada: "bg-gray-200 text-gray-600",
  pausada: "bg-yellow-100 text-yellow-700",
  rascunho: "bg-blue-100 text-blue-700",
};

// ===== Redes sociais por marca (rodapé) =====
// Colégio CPPEM: conferido no rodapé de colegio.cppem.com.br.
// CPPEM Concursos: mesmas redes usadas no site/Central de Ajuda do CPPEM.
export type SocialKey =
  | "instagram" | "youtube" | "tiktok" | "threads" | "facebook" | "x" | "linkedin" | "whatsapp";

export interface BrandSocial {
  key: SocialKey;
  label: string;
  href: string;
}

export interface Brand {
  id: "cppem" | "colegio" | "unicive";
  name: string;
  tagline: string;
  site?: { label: string; href: string };
  socials: BrandSocial[];
}

export const BRANDS: Brand[] = [
  {
    id: "cppem",
    name: "CPPEM Concursos",
    tagline: "Cursos e preparação para concursos públicos",
    site: { label: "cppem.com.br", href: "https://cppem.com.br" },
    socials: [
      { key: "instagram", label: "Instagram", href: "https://www.instagram.com/cppemconcursos/" },
      { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@cppemconcursos" },
      { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@cppemconcursos" },
      { key: "threads", label: "Threads", href: "https://www.threads.net/@cppemconcursos" },
      { key: "facebook", label: "Facebook", href: "https://www.facebook.com/people/Cppem-Cursos-preparat%C3%B3rios/61550943416378/" },
      { key: "x", label: "X", href: "https://x.com/cppem_concursos" },
      { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/cppem" },
    ],
  },
  {
    id: "colegio",
    name: "Colégio CPPEM",
    tagline: "Educação que forma para a vida",
    site: { label: "colegio.cppem.com.br", href: "https://colegio.cppem.com.br" },
    socials: [
      { key: "instagram", label: "Instagram", href: "https://www.instagram.com/colegiocppem/" },
      { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@colegiocppem" },
      { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@colegiocppem" },
      { key: "threads", label: "Threads", href: "https://www.threads.com/@colegiocppem" },
      {
        key: "whatsapp",
        label: "WhatsApp",
        href: "https://wa.me/5581997076388?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20sobre%20o%20Col%C3%A9gio%20Cppem",
      },
    ],
  },
  {
    id: "unicive",
    name: "Unicive Caruaru",
    tagline: "Ensino superior EAD",
    socials: [
      { key: "instagram", label: "Instagram", href: "https://www.instagram.com/unicive.caruaru" },
      { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@unicive.caruaru" },
      { key: "threads", label: "Threads", href: "https://www.threads.com/@unicive.caruaru" },
      { key: "facebook", label: "Facebook", href: "https://www.facebook.com/profile.php?id=61558200731928" },
    ],
  },
];

/** Nome do sistema interno de recrutamento (área administrativa). */
export const SYSTEM_NAME = "RH CPPEM";
