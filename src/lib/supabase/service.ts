import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a chave service_role: usado SÓ no servidor, para o que
 * o visitante faz sem login (enviar candidatura, escolher horário de entrevista)
 * e para a avaliação automática por IA. Ignora o RLS, por isso nunca pode ir
 * para o navegador: a chave fica em SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC_).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const HAS_SERVICE_ROLE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
