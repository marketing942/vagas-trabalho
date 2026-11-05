import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/rh/admin-auth";
import { analyzeInterview } from "@/lib/rh/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Admin: análise da entrevista pela IA (copiloto). Só sugere; as notas são da equipe. */
export async function POST(req: NextRequest) {
  const db = await adminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Faça login novamente." }, { status: 401 });
  const { applicationId } = await req.json().catch(() => ({}));
  if (typeof applicationId !== "string") return NextResponse.json({ ok: false, error: "Candidatura inválida" }, { status: 400 });
  const result = await analyzeInterview(db, applicationId);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
