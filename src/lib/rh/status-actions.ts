import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppStatus } from "@/lib/types";

/**
 * Muda o resultado da candidatura (contratado, reprovado, desligado ou de volta ao processo).
 * O histórico e a data de fechamento são gravados pelo banco.
 */
export async function setAppStatus(db: SupabaseClient, applicationId: string, status: AppStatus, reason?: string | null): Promise<string | null> {
  if (status === "reprovado" && !reason) return "Escolha o motivo da reprovação.";
  const { error } = await db
    .from("applications")
    .update({ status, rejection_reason: status === "reprovado" ? reason : null })
    .eq("id", applicationId);
  if (!error) return null;
  if (error.code === "23505") return "Esta pessoa já tem outro card em aberto neste funil. Junte as vagas nele em vez de reabrir este.";
  return "Não foi possível atualizar. Tente de novo.";
}
