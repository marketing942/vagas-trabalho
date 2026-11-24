import type { Application } from "@/lib/types";

type Row = Pick<Application, "id" | "ai_status" | "created_at"> & { updated_at?: string; status?: string };

/**
 * Avaliações da IA que ficaram para trás: "aguardando" há mais de 2 minutos
 * (o envio terminou, mas a avaliação não começou) ou "avaliando" há mais de 6
 * (o servidor foi encerrado no meio). Só candidaturas ainda em processo.
 */
export function stuckEvaluations(apps: Row[], now = Date.now()): string[] {
  return apps
    .filter((a) => {
      if (a.status && a.status !== "em_processo") return false;
      if (a.ai_status === "pendente") return now - new Date(a.created_at).getTime() > 2 * 60_000;
      if (a.ai_status === "avaliando") return now - new Date(a.updated_at ?? a.created_at).getTime() > 6 * 60_000;
      return false;
    })
    .slice(0, 5)
    .map((a) => a.id);
}

/** Pede ao servidor para avaliar de novo (em segundo plano, sem botão). Devolve se alguma terminou. */
export async function retryEvaluations(ids: string[]): Promise<boolean> {
  if (!ids.length) return false;
  const res = await Promise.all(
    ids.map((applicationId) =>
      fetch("/api/admin/avaliar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId }) }).catch(() => null)
    )
  );
  return res.some(Boolean);
}
