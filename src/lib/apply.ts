import type { Job, SiteSettings } from "./types";

export interface ApplyTarget {
  href: string;
  /** Link externo (Notion): abre em nova aba */
  external: boolean;
}

/**
 * Para onde vai o botão "Candidatar-se".
 * Com o formulário próprio ligado (Admin > Configurações), vai para /candidatura
 * (já com a vaga marcada). Desligado, continua indo para o formulário do Notion.
 */
export function applyTarget(
  settings: Pick<SiteSettings, "applications_enabled" | "form_url">,
  job?: Pick<Job, "slug" | "apply_url"> | null
): ApplyTarget {
  if (settings.applications_enabled) {
    return { href: job ? `/candidatura?vaga=${encodeURIComponent(job.slug)}` : "/candidatura", external: false };
  }
  return { href: job?.apply_url || settings.form_url, external: true };
}
