import { NextResponse } from "next/server";
import { adminClient } from "@/lib/rh/admin-auth";
import { HAS_SERVICE_ROLE } from "@/lib/supabase/service";
import { AI_MODEL, HAS_AI } from "@/lib/rh/ai";

/** Admin: o que já está configurado no servidor (sem revelar as chaves). */
export async function GET() {
  const db = await adminClient();
  if (!db) return NextResponse.json({ error: "Faça login novamente." }, { status: 401 });
  // 0010 (tabelas do RH) e 0011 (resultado, várias vagas, roteiro e motivos)
  const [{ error }, { error: e11 }] = await Promise.all([
    db.from("applications").select("id, status, jobs, culture_quiz", { head: true, count: "exact" }).limit(1),
    db.from("rh_settings").select("id, message_templates").limit(1),
  ]);
  return NextResponse.json({ serviceRole: HAS_SERVICE_ROLE, ai: HAS_AI, aiModel: AI_MODEL, migration: !error && !e11 });
}
