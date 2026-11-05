import type { SupabaseClient } from "@supabase/supabase-js";
import { advanceStage, logInterview } from "./interview-flow";
import type { Application, MessageTemplate } from "@/lib/types";

/**
 * Depois de abrir a mensagem no WhatsApp: registra no histórico e faz o efeito de cada modelo.
 *  - convite: avança para "Convite enviado" (se ainda estava antes);
 *  - devolutiva: marca a devolutiva como enviada.
 */
export async function afterMessageSent(db: SupabaseClient, app: Pick<Application, "id" | "stage">, template: Pick<MessageTemplate, "key" | "label">) {
  if (template.key === "convite") await advanceStage(db, app, "convite", ["novo", "visto", "avaliado_ia"]);
  if (template.key.startsWith("devolutiva")) {
    await db.from("applications").update({ feedback_sent_at: new Date().toISOString() }).eq("id", app.id);
    await logInterview(db, app.id, `Devolutiva enviada pelo WhatsApp (${template.label})`);
    return;
  }
  await logInterview(db, app.id, `Mensagem enviada pelo WhatsApp: ${template.label}`);
}
