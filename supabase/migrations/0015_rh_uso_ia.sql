-- ==============================================================
-- 0015 — RH: consumo da IA (tokens e custo), para o painel.
-- Idempotente (pode rodar mais de uma vez). Não guarda texto nem dados
-- pessoais: só quando foi chamada, para quê, o modelo e as quantidades.
-- ==============================================================

create table if not exists public.ai_usage (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  kind              text not null check (kind in ('avaliacao', 'copiloto', 'comparacao')),
  application_id    uuid references public.applications(id) on delete set null,
  model             text,
  prompt_tokens     integer not null default 0,   -- entrada (total)
  cache_hit_tokens  integer not null default 0,   -- parte da entrada que veio do cache (mais barata)
  completion_tokens integer not null default 0    -- saída
);

create index if not exists ai_usage_created_idx on public.ai_usage (created_at desc);

alter table public.ai_usage enable row level security;
drop policy if exists "admin full access ai usage" on public.ai_usage;
create policy "admin full access ai usage" on public.ai_usage
  for all to authenticated using (true) with check (true);

-- Preços da DeepSeek (US$ por 1 milhão de tokens) e cotação do dólar, editáveis no painel.
-- Padrões: DeepSeek-V4-Flash (tabela oficial); confira em api-docs.deepseek.com/quick_start/pricing.
alter table public.rh_settings
  add column if not exists ai_price_in      numeric(10, 4) not null default 0.14,
  add column if not exists ai_price_in_cache numeric(10, 4) not null default 0.0028,
  add column if not exists ai_price_out     numeric(10, 4) not null default 0.28,
  add column if not exists ai_usd_brl       numeric(8, 4)  not null default 5.50;
