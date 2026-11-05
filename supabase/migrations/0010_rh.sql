-- ==============================================================
-- 0010 — Sistema de RH: candidaturas pelo site, pipeline, scorecard
--         de IA, entrevistas (agenda) e currículos.
-- Idempotente (pode rodar mais de uma vez).
--
-- Segurança: nenhum visitante lê ou altera estes dados. Só o admin
-- (usuário logado) acessa. O formulário e o agendamento do site gravam
-- pelo servidor, com a chave service_role (que nunca vai para o navegador).
-- ==============================================================

-- --------------------------------------------------------------
-- 1) Candidatos (a pessoa). Uma pessoa pode se candidatar a várias vagas.
-- --------------------------------------------------------------
create table if not exists public.candidates (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  email            text,
  whatsapp         text not null,
  -- Só os números do WhatsApp: usado para reconhecer a mesma pessoa
  whatsapp_digits  text generated always as (regexp_replace(whatsapp, '\D', '', 'g')) stored,
  social_url       text,
  age_range        text,
  city             text,
  about            text,
  -- "Como encontrou essa vaga?" (pode marcar mais de uma)
  sources          text[] not null default '{}',
  -- Currículo no Storage (bucket privado "curriculos")
  resume_path      text,
  resume_name      text,
  -- site | notion (importado) | admin (cadastrado à mão) | agenda (link de entrevista)
  origin           text not null default 'site',
  -- Identificador estável de quem veio de importação (evita duplicar ao reimportar)
  external_ref     text unique,
  -- Quando a pessoa aceitou a Política de Privacidade
  consent_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint candidates_origin_check check (origin in ('site', 'notion', 'admin', 'agenda'))
);

create index if not exists candidates_whatsapp_idx on public.candidates (whatsapp_digits);
create index if not exists candidates_email_idx    on public.candidates (lower(email));
create index if not exists candidates_created_idx  on public.candidates (created_at desc);

-- --------------------------------------------------------------
-- 2) Candidaturas: uma por pessoa e vaga. Cada uma tem a sua etapa,
--    o seu scorecard de IA e o seu scorecard de entrevista.
-- --------------------------------------------------------------
create table if not exists public.applications (
  id                 uuid primary key default gen_random_uuid(),
  candidate_id       uuid not null references public.candidates (id) on delete cascade,
  -- Vaga (vazio = Banco de Talentos ou vaga que não existe mais no site)
  job_id             uuid references public.jobs (id) on delete set null,
  -- Nome da vaga no momento da candidatura (fica mesmo se a vaga for apagada)
  job_title          text not null,
  -- Funil: 'trabalho' (ATS) ou 'professor'
  pipeline           text not null,
  stage              text not null default 'novo',
  rejection_reason   text,
  -- Avaliação por IA (perfil x requisitos da vaga)
  ai_status          text not null default 'pendente',
  ai_score           smallint,
  ai_report          jsonb,
  ai_model           text,
  ai_evaluated_at    timestamptz,
  ai_error           text,
  -- Scorecard da entrevista (0 a 10), igual ao Notion
  score_fit          smallint,
  score_proatividade smallint,
  score_comunicacao  smallint,
  score_resiliencia  smallint,
  score_tecnica      smallint,
  -- Média dos 5 critérios (mesma fórmula do Notion: vazio conta como 0)
  interview_score    numeric(4, 2) generated always as (
    (coalesce(score_fit, 0) + coalesce(score_proatividade, 0) + coalesce(score_comunicacao, 0)
      + coalesce(score_resiliencia, 0) + coalesce(score_tecnica, 0)) / 5.0
  ) stored,
  notes              text,
  -- Link pessoal de agendamento de entrevista (/agenda?c=...)
  booking_token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  stage_changed_at   timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint applications_pipeline_check check (pipeline in ('trabalho', 'professor')),
  constraint applications_stage_check check (stage in (
    'novo', 'visto', 'avaliado_ia', 'convite', 'entrevista', 'entrevistado',
    'onboarding', 'treinamento', 'contratado', 'depois', 'proximo_ano', 'reprovado', 'desligado'
  )),
  constraint applications_ai_status_check check (ai_status in ('pendente', 'avaliando', 'concluida', 'erro', 'sem_ia')),
  constraint applications_ai_score_check check (ai_score between 0 and 100),
  constraint applications_scores_check check (
    coalesce(score_fit, 0) between 0 and 10 and coalesce(score_proatividade, 0) between 0 and 10
    and coalesce(score_comunicacao, 0) between 0 and 10 and coalesce(score_resiliencia, 0) between 0 and 10
    and coalesce(score_tecnica, 0) between 0 and 10
  ),
  -- A mesma pessoa não entra duas vezes na mesma vaga
  constraint applications_candidate_job_unique unique (candidate_id, job_id)
);

create index if not exists applications_pipeline_stage_idx on public.applications (pipeline, stage);
create index if not exists applications_job_idx            on public.applications (job_id);
create index if not exists applications_candidate_idx      on public.applications (candidate_id);
create index if not exists applications_created_idx        on public.applications (created_at desc);

-- --------------------------------------------------------------
-- 3) Histórico de cada candidatura (linha do tempo da ficha)
-- --------------------------------------------------------------
create table if not exists public.application_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  -- criada | etapa | avaliacao_ia | entrevista | nota | edicao
  kind           text not null,
  from_stage     text,
  to_stage       text,
  detail         text,
  -- admin | sistema | candidato | ia
  actor          text not null default 'admin',
  created_by     uuid default auth.uid(),
  created_at     timestamptz not null default now()
);

create index if not exists application_events_app_idx on public.application_events (application_id, created_at desc);

-- --------------------------------------------------------------
-- 4) Entrevistas (agenda)
-- --------------------------------------------------------------
create table if not exists public.interviews (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid not null references public.candidates (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  -- agendada | realizada | faltou | cancelada
  status         text not null default 'agendada',
  location       text,
  notes          text,
  -- admin (marcada no painel) | link (escolhida pelo candidato)
  created_via    text not null default 'admin',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint interviews_time_check check (ends_at > starts_at),
  constraint interviews_status_check check (status in ('agendada', 'realizada', 'faltou', 'cancelada')),
  constraint interviews_via_check check (created_via in ('admin', 'link'))
);

create index if not exists interviews_starts_idx    on public.interviews (starts_at);
create index if not exists interviews_candidate_idx on public.interviews (candidate_id);

-- --------------------------------------------------------------
-- 5) Configurações novas
-- --------------------------------------------------------------
alter table public.site_settings
  -- Liga o formulário próprio do site. Desligado = botões continuam indo para o Notion.
  add column if not exists applications_enabled boolean not null default false,
  -- Avaliar automaticamente com IA cada candidatura nova
  add column if not exists ai_auto_evaluate     boolean not null default true,
  -- Disponibilidade para entrevistas (dias da semana: 1 = segunda ... 6 = sábado)
  add column if not exists agenda_config        jsonb not null default '{
    "slot_minutes": 30,
    "min_notice_hours": 12,
    "horizon_days": 21,
    "weekly": {
      "1": [["08:30", "11:30"], ["14:00", "17:00"]],
      "2": [["08:30", "11:30"], ["14:00", "17:00"]],
      "3": [["08:30", "11:30"], ["14:00", "17:00"]],
      "4": [["08:30", "11:30"], ["14:00", "17:00"]],
      "5": [["08:30", "11:30"], ["14:00", "17:00"]]
    },
    "blocked_dates": [],
    "location": "Praça Presidente Getúlio Vargas, 1119 – Caruaru-PE (Prédio de 5 andares)",
    "instructions": "Chegue com 10 minutos de antecedência e traga um documento com foto."
  }'::jsonb;

-- --------------------------------------------------------------
-- 6) Atualização automática de updated_at e do histórico
-- --------------------------------------------------------------
drop trigger if exists candidates_set_updated_at on public.candidates;
create trigger candidates_set_updated_at before update on public.candidates
  for each row execute function public.set_updated_at();

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at before update on public.interviews
  for each row execute function public.set_updated_at();

-- Quem fez a mudança, a partir do login da requisição
create or replace function public.rh_actor()
returns text language sql stable as $$
  select case coalesce(auth.jwt()->>'role', '')
    when 'authenticated' then 'admin'
    else 'sistema'
  end
$$;

-- Etapa mudou: guarda a data da mudança
create or replace function public.applications_stage_timestamp()
returns trigger language plpgsql as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists applications_stage_timestamp on public.applications;
create trigger applications_stage_timestamp before update on public.applications
  for each row execute function public.applications_stage_timestamp();

-- Registra no histórico a criação e cada mudança de etapa
create or replace function public.applications_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_origin text;
begin
  if tg_op = 'INSERT' then
    select origin into v_origin from public.candidates where id = new.candidate_id;
    insert into public.application_events (application_id, kind, to_stage, actor, detail)
    values (new.id, 'criada', new.stage, public.rh_actor(),
      case v_origin
        when 'site'   then 'Candidatura enviada pelo site'
        when 'notion' then 'Importada do Notion'
        when 'agenda' then 'Criada pelo link de agendamento'
        else 'Cadastrada pelo admin'
      end);
  elsif new.stage is distinct from old.stage then
    insert into public.application_events (application_id, kind, from_stage, to_stage, actor, detail)
    values (new.id, 'etapa', old.stage, new.stage, public.rh_actor(),
      case when new.stage = 'reprovado' then new.rejection_reason end);
  end if;
  return null;
end;
$$;

drop trigger if exists applications_log on public.applications;
create trigger applications_log after insert or update on public.applications
  for each row execute function public.applications_log();

-- --------------------------------------------------------------
-- 7) Agendamento pelo link: reserva o horário sem risco de duas
--    pessoas pegarem o mesmo (trava + checagem na mesma transação).
--    Só o servidor (service_role) pode chamar.
-- --------------------------------------------------------------
create or replace function public.book_interview(
  p_candidate_id   uuid,
  p_application_id uuid,
  p_starts_at      timestamptz,
  p_ends_at        timestamptz,
  p_location       text,
  p_replace_id     uuid default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('cppem-agenda'));
  if exists (
    select 1 from public.interviews
    where status = 'agendada'
      and tstzrange(starts_at, ends_at) && tstzrange(p_starts_at, p_ends_at)
      and (p_replace_id is null or id <> p_replace_id)
  ) then
    raise exception 'horario_indisponivel' using errcode = 'P0001';
  end if;

  -- Remarcação: o horário antigo é liberado
  if p_replace_id is not null then
    update public.interviews set status = 'cancelada' where id = p_replace_id and status = 'agendada';
  end if;

  insert into public.interviews (candidate_id, application_id, starts_at, ends_at, location, created_via)
  values (p_candidate_id, p_application_id, p_starts_at, p_ends_at, p_location, 'link')
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.book_interview(uuid, uuid, timestamptz, timestamptz, text, uuid) from public, anon, authenticated;
grant execute on function public.book_interview(uuid, uuid, timestamptz, timestamptz, text, uuid) to service_role;

-- --------------------------------------------------------------
-- 8) Segurança (RLS): só o admin logado lê e altera. Visitantes, nada.
-- --------------------------------------------------------------
alter table public.candidates         enable row level security;
alter table public.applications       enable row level security;
alter table public.application_events enable row level security;
alter table public.interviews         enable row level security;

drop policy if exists "admin full access candidates" on public.candidates;
create policy "admin full access candidates" on public.candidates
  for all to authenticated using (true) with check (true);

drop policy if exists "admin full access applications" on public.applications;
create policy "admin full access applications" on public.applications
  for all to authenticated using (true) with check (true);

drop policy if exists "admin full access application events" on public.application_events;
create policy "admin full access application events" on public.application_events
  for all to authenticated using (true) with check (true);

drop policy if exists "admin full access interviews" on public.interviews;
create policy "admin full access interviews" on public.interviews
  for all to authenticated using (true) with check (true);

-- --------------------------------------------------------------
-- 9) Currículos: bucket PRIVADO (ninguém abre por link público).
--    O admin vê por links temporários; o servidor envia os arquivos.
-- --------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculos', 'curriculos', false, 10485760, array[
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png', 'image/webp'
])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin read curriculos" on storage.objects;
create policy "admin read curriculos" on storage.objects
  for select to authenticated using (bucket_id = 'curriculos');

drop policy if exists "admin upload curriculos" on storage.objects;
create policy "admin upload curriculos" on storage.objects
  for insert to authenticated with check (bucket_id = 'curriculos');

drop policy if exists "admin delete curriculos" on storage.objects;
create policy "admin delete curriculos" on storage.objects
  for delete to authenticated using (bucket_id = 'curriculos');
