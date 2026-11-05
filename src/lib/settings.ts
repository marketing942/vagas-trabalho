import { cache } from "react";
import { createPublicClient, HAS_SUPABASE } from "./supabase/public";
import type { SiteSettings } from "./types";
import { DEPARTMENTS, UNITS } from "./constants";

/** Valores padrão usados como fallback caso o Supabase não esteja configurado. */
export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  company_name: "CPPEM Colégio e Cursos",
  about_text:
    "Há mais de 7 anos, o CPPEM trabalha todos os dias com um único propósito ambicioso: transformar vidas por meio da educação. Somando o CPPEM Concursos e a atuação no ensino superior EAD, já são cerca de 14.000 alunos aprovados em concursos públicos em todo o Brasil — histórias reais de mudança, dignidade e futuro. Além disso, contamos com mais de 50 colaboradores e professores juntos mudando vidas.",
  stat_years: "+7 anos de história",
  stat_students: "+14.000 alunos aprovados",
  stat_team: "+50 colaboradores e professores",
  stat_extra: "Educação, disciplina e transformação de vidas",
  form_url:
    "https://cppem.notion.site/2e5bbae8074c80a4b7ddf45a8fb28f97?pvs=105",
  linktree_cppem_url: null,
  linktree_colegio_url: null,
  linktree_unicive_url: null,
  linkedin_url: null,
  departments: [...DEPARTMENTS],
  units: [...UNITS],
  whatsapp_group_url:
    "https://chat.whatsapp.com/JKlwbSeG38ECLh5UJSRGl3?mode=gi_t",
  address:
    "Praça Presidente Getúlio Vargas, 1119 – Caruaru, Pernambuco, Prédio de 5 andares",
  cnpj: "57.347.872/0001-48",
  maps_url: "https://links.cppem.com.br/localiza%C3%A7%C3%A3o-maps",
  footer_description:
    "Há mais de 7 anos transformando vidas por meio da educação.",
  privacy_email: null,
  why_items: null,
  process_steps: null,
  faq_items: null,
  applications_enabled: false,
  ai_auto_evaluate: true,
  agenda_config: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Busca as configurações do site (linha única). Campos que ainda não existem
 * no banco (migration pendente) caem nos valores padrão.
 * `cache` evita consultar duas vezes na mesma requisição.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!HAS_SUPABASE) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...(data as Partial<SiteSettings>) } as SiteSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
});
