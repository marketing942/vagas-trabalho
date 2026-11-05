/**
 * Busca todas as linhas de uma consulta, de 1000 em 1000 (o Supabase devolve no
 * máximo 1000 linhas por vez). `page(from, to)` deve aplicar `.range(from, to)`.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<{ data: T[]; error: string | null }> {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const res = await page(from, from + size - 1);
    if (res.error) return { data: out, error: res.error.message };
    const data = (res.data as T[] | null) ?? [];
    out.push(...data);
    if (data.length < size) return { data: out, error: null };
  }
}
