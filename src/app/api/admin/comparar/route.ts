import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/rh/admin-auth";
import { compareFinalists } from "@/lib/rh/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Admin: resumo comparativo de 2 a 4 finalistas pela IA (só sugestão). */
export async function POST(req: NextRequest) {
  const db = await adminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Faça login novamente." }, { status: 401 });
  const { ids } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids) || !ids.every((i) => typeof i === "string")) return NextResponse.json({ ok: false, error: "Seleção inválida" }, { status: 400 });
  const result = await compareFinalists(db, ids);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
