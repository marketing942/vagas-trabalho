import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Cliente do admin logado (pelos cookies). Retorna null se não houver login. */
export async function adminClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? supabase : null;
}
