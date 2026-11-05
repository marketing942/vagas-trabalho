import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_INTERVIEW_SCRIPT, DEFAULT_REJECTION_REASONS } from "./constants";
import type { InterviewScript, RhSettings } from "@/lib/types";

export const DEFAULT_RH_SETTINGS: RhSettings = {
  rejection_reasons: DEFAULT_REJECTION_REASONS,
  interview_script: DEFAULT_INTERVIEW_SCRIPT,
};

/** Confere o formato do roteiro (vindo do banco ou do editor). */
export function cleanScript(raw: unknown): InterviewScript {
  const sections = (raw as InterviewScript | null)?.sections;
  if (!Array.isArray(sections)) return DEFAULT_INTERVIEW_SCRIPT;
  return {
    sections: sections.map((s) => ({
      title: String(s?.title ?? ""),
      questions: (Array.isArray(s?.questions) ? s.questions : []).map((q) => ({
        q: String(q?.q ?? ""),
        hint: q?.hint ? String(q.hint) : "",
        ...(q?.answer != null ? { answer: String(q.answer) } : {}),
      })),
    })),
  };
}

/** Configurações privadas do RH (motivos de reprovação e roteiro). Sem a migração 0011, usa o padrão. */
export async function loadRhSettings(db: SupabaseClient): Promise<RhSettings & { ready: boolean }> {
  const { data, error } = await db.from("rh_settings").select("rejection_reasons, interview_script").eq("id", 1).maybeSingle();
  if (error || !data) return { ...DEFAULT_RH_SETTINGS, ready: false };
  return {
    rejection_reasons: Array.isArray(data.rejection_reasons) && data.rejection_reasons.length ? data.rejection_reasons : DEFAULT_REJECTION_REASONS,
    interview_script: cleanScript(data.interview_script),
    ready: true,
  };
}
