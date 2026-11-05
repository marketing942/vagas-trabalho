import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, HAS_SERVICE_ROLE } from "@/lib/supabase/service";
import { scoreQuiz } from "@/lib/rh/culture-quiz-scores";

export const runtime = "nodejs";

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 10;
}

const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/** Recebe o questionário de cultura (link pessoal). Responde uma vez só; a nota é calculada aqui. */
export async function POST(req: NextRequest) {
  if (!HAS_SERVICE_ROLE) return fail("O questionário ainda não está disponível.", 503);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) return fail("Muitas tentativas. Tente de novo em alguns minutos.", 429);
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!/^[0-9a-f]{32}$/.test(token)) return fail("Link inválido.", 404);
  const result = scoreQuiz(body?.answers);
  if (!result) return fail("Responda todas as situações para enviar.");

  const db = createServiceClient();
  const { data: app } = await db.from("applications").select("id, status, culture_quiz").eq("booking_token", token).maybeSingle();
  if (!app || app.status !== "em_processo") return fail("Este link não é válido ou o processo já foi encerrado.", 404);
  if (app.culture_quiz) return fail("Você já respondeu este questionário.", 409);

  const { error } = await db.from("applications").update({ culture_quiz: result }).eq("id", app.id).is("culture_quiz", null);
  if (error) return fail("Não foi possível enviar agora. Tente de novo.", 500);
  await db.from("application_events").insert({ application_id: app.id, kind: "questionario", actor: "candidato", detail: `Questionário de cultura respondido: ${result.score}/100` });
  return NextResponse.json({ ok: true });
}
