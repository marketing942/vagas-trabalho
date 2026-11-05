-- ==============================================================
-- 0014 — RH: rotina de LGPD (prazo de guarda dos dados de candidatos).
-- Idempotente (pode rodar mais de uma vez). Não apaga nada sozinha:
-- a equipe vê a lista em Configurações → RH → Privacidade e decide.
-- ==============================================================

-- Prazo de guarda (meses) para quem não foi contratado. A Política de Privacidade diz 2 anos.
alter table public.rh_settings
  add column if not exists retention_months smallint not null default 24;

alter table public.rh_settings drop constraint if exists rh_settings_retention_check;
alter table public.rh_settings add constraint rh_settings_retention_check check (retention_months between 6 and 120);

-- Quando o cadastro foi anonimizado (fica só o que serve para estatística)
alter table public.candidates
  add column if not exists anonymized_at timestamptz;

-- --------------------------------------------------------------
-- Quem passou do prazo: sem processo em aberto, nunca contratado,
-- ainda não anonimizado e sem nenhuma movimentação no prazo.
-- security invoker: só o admin logado (RLS) enxerga.
-- --------------------------------------------------------------
create or replace function public.rh_retention_candidates(p_months int)
returns table (
  id               uuid,
  full_name        text,
  origin           text,
  last_activity    timestamptz,
  applications     int,
  has_resume       boolean
)
language sql stable security invoker set search_path = public as $$
  select c.id, c.full_name, c.origin,
         greatest(c.updated_at, coalesce(max(greatest(a.updated_at, coalesce(a.closed_at, a.updated_at))), c.updated_at)) as last_activity,
         count(a.id)::int as applications,
         c.resume_path is not null as has_resume
    from public.candidates c
    left join public.applications a on a.candidate_id = c.id
   where c.anonymized_at is null
   group by c.id
  having bool_and(coalesce(a.status, 'reprovado') not in ('em_processo', 'contratado', 'desligado'))
     and greatest(c.updated_at, coalesce(max(greatest(a.updated_at, coalesce(a.closed_at, a.updated_at))), c.updated_at))
         < now() - make_interval(months => p_months)
   order by 4
$$;

-- --------------------------------------------------------------
-- Anonimiza os cadastros escolhidos: apaga o que identifica a pessoa e
-- mantém o que serve para estatística (vagas, etapas, resultado, motivos,
-- notas, origem e datas). Ignora quem tem processo aberto ou foi contratado.
-- Devolve os currículos que o painel deve apagar do Storage.
-- --------------------------------------------------------------
create or replace function public.rh_anonymize_candidates(p_ids uuid[])
returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v_ids   uuid[];
  v_paths text[];
begin
  select coalesce(array_agg(c.id), '{}')
    into v_ids
    from public.candidates c
   where c.id = any(p_ids)
     and c.anonymized_at is null
     and not exists (
       select 1 from public.applications a
        where a.candidate_id = c.id and a.status in ('em_processo', 'contratado', 'desligado')
     );

  select coalesce(array_agg(resume_path), '{}') into v_paths
    from public.candidates where id = any(v_ids) and resume_path is not null;

  update public.candidates set
    full_name     = 'Candidato anonimizado',
    email         = null,
    whatsapp      = 'anonimizado',
    social_url    = null,
    age_range     = null,
    city          = null,
    about         = null,
    resume_path   = null,
    resume_name   = null,
    external_ref  = null,
    anonymized_at = now()
  where id = any(v_ids);

  update public.applications set
    notes             = null,
    interview_answers = null,
    interview_ai      = null,
    ai_report         = null,
    screening         = null,
    -- link pessoal (agenda/questionário) deixa de funcionar
    booking_token     = md5(random()::text || clock_timestamp()::text || id::text)
  where candidate_id = any(v_ids);

  update public.application_events set detail = null
   where kind = 'nota' and application_id in (select id from public.applications where candidate_id = any(v_ids));

  update public.interviews set notes = null where candidate_id = any(v_ids);

  return jsonb_build_object('count', coalesce(array_length(v_ids, 1), 0), 'resume_paths', to_jsonb(v_paths));
end;
$$;

revoke all on function public.rh_retention_candidates(int) from public, anon;
revoke all on function public.rh_anonymize_candidates(uuid[]) from public, anon;
grant execute on function public.rh_retention_candidates(int) to authenticated;
grant execute on function public.rh_anonymize_candidates(uuid[]) to authenticated;
