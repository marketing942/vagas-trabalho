-- ==============================================================
-- 0011 — RH: resultado (ganho/perda) separado das etapas, várias vagas
--         no mesmo card, motivos de reprovação e roteiro de entrevista.
-- Idempotente (pode rodar mais de uma vez). Converte os dados que já existem.
--
--  * Contratado, Reprovado e Desligado deixam de ser etapas do processo e viram
--    o RESULTADO da candidatura (coluna status), como "ganho" e "perdido" num CRM.
--    A etapa fica guardada como "onde a pessoa estava" quando o processo fechou.
--  * Uma pessoa tem UM card por funil (Trabalho / Professores), com todas as vagas
--    que escolheu dentro dele (coluna jobs). Cards repetidos são juntados.
-- ==============================================================

-- --------------------------------------------------------------
-- 1) Novas colunas
-- --------------------------------------------------------------
alter table public.applications
  add column if not exists status            text not null default 'em_processo',
  add column if not exists closed_at         timestamptz,
  -- Todas as vagas do card: [{"id": "<uuid ou null>", "title": "Vendedor Interno"}]
  add column if not exists jobs              jsonb not null default '[]'::jsonb,
  -- Roteiro de entrevista preenchido nesta candidatura (perguntas editáveis + respostas)
  add column if not exists interview_answers jsonb;

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('em_processo', 'contratado', 'reprovado', 'desligado'));

-- Enquanto os dados são convertidos, o histórico não registra nada
alter table public.applications disable trigger applications_log;
alter table public.applications disable trigger applications_stage_timestamp;

-- Vagas: cada card começa com a vaga que já tinha
update public.applications
   set jobs = jsonb_build_array(jsonb_build_object('id', job_id, 'title', job_title))
 where jobs = '[]'::jsonb;

-- --------------------------------------------------------------
-- 2) Contratado / Reprovado / Desligado viram resultado
-- --------------------------------------------------------------
-- Volta a etapa para onde a pessoa estava antes (pelo histórico); sem histórico,
-- usa uma etapa coerente.
with closing as (
  select a.id, a.stage as old_stage,
    (select e.from_stage
       from public.application_events e
      where e.application_id = a.id and e.kind = 'etapa' and e.to_stage = a.stage
        and e.from_stage in ('novo', 'visto', 'avaliado_ia', 'convite', 'entrevista', 'entrevistado', 'onboarding', 'treinamento')
      order by e.created_at desc limit 1) as prev_stage,
    a.ai_score
  from public.applications a
  where a.stage in ('contratado', 'reprovado', 'desligado')
)
update public.applications a
   set status    = c.old_stage,
       closed_at = coalesce(a.closed_at, a.stage_changed_at),
       stage     = coalesce(c.prev_stage, case
                     when c.old_stage = 'reprovado' and c.ai_score is not null then 'avaliado_ia'
                     when c.old_stage = 'reprovado' then 'novo'
                     when a.pipeline = 'professor' then 'entrevistado'
                     else 'treinamento' end)
  from closing c
 where a.id = c.id;

alter table public.applications drop constraint if exists applications_stage_check;
alter table public.applications add constraint applications_stage_check check (stage in (
  'novo', 'visto', 'avaliado_ia', 'convite', 'entrevista', 'entrevistado',
  'onboarding', 'treinamento', 'depois', 'proximo_ano'
));

-- --------------------------------------------------------------
-- 3) Um card por pessoa e funil: junta as candidaturas em aberto
-- --------------------------------------------------------------
create or replace function public.rh_stage_rank(p_stage text)
returns int language sql immutable as $$
  select case p_stage
    when 'novo' then 0 when 'visto' then 1 when 'avaliado_ia' then 2 when 'depois' then 2
    when 'proximo_ano' then 2 when 'convite' then 3 when 'entrevista' then 4
    when 'entrevistado' then 5 when 'onboarding' then 6 when 'treinamento' then 7 else 0 end
$$;

do $$
declare
  g record;
  v_keep uuid;
begin
  for g in
    select candidate_id, pipeline
      from public.applications
     where status = 'em_processo'
     group by candidate_id, pipeline
    having count(*) > 1
  loop
    -- Fica o card mais avançado (depois o de maior score da IA, depois o mais antigo)
    select id into v_keep
      from public.applications
     where candidate_id = g.candidate_id and pipeline = g.pipeline and status = 'em_processo'
     order by public.rh_stage_rank(stage) desc, ai_score desc nulls last, created_at
     limit 1;

    update public.applications k set
      jobs = (
        select coalesce(jsonb_agg(x.j order by x.created_at), '[]'::jsonb)
          from (
            select distinct on (coalesce(j->>'id', j->>'title')) j, a.created_at
              from public.applications a
              cross join lateral jsonb_array_elements(a.jobs) j
             where a.candidate_id = g.candidate_id and a.pipeline = g.pipeline and a.status = 'em_processo'
             order by coalesce(j->>'id', j->>'title'), a.created_at
          ) x
      ),
      ai_score           = coalesce(k.ai_score, s.ai_score),
      score_fit          = coalesce(k.score_fit, s.score_fit),
      score_proatividade = coalesce(k.score_proatividade, s.score_proatividade),
      score_comunicacao  = coalesce(k.score_comunicacao, s.score_comunicacao),
      score_resiliencia  = coalesce(k.score_resiliencia, s.score_resiliencia),
      score_tecnica      = coalesce(k.score_tecnica, s.score_tecnica),
      notes              = nullif(concat_ws(E'\n\n', k.notes, s.notes), ''),
      created_at         = least(k.created_at, s.created_at)
    from (
      select max(ai_score) as ai_score, max(score_fit) as score_fit, max(score_proatividade) as score_proatividade,
             max(score_comunicacao) as score_comunicacao, max(score_resiliencia) as score_resiliencia,
             max(score_tecnica) as score_tecnica, min(created_at) as created_at,
             string_agg(notes, E'\n\n' order by created_at) filter (where notes is not null and notes <> '') as notes
        from public.applications
       where candidate_id = g.candidate_id and pipeline = g.pipeline and status = 'em_processo' and id <> v_keep
    ) s
    where k.id = v_keep;

    -- Histórico e entrevistas passam para o card que ficou
    update public.application_events set application_id = v_keep
     where application_id in (select id from public.applications
                               where candidate_id = g.candidate_id and pipeline = g.pipeline and status = 'em_processo' and id <> v_keep);
    update public.interviews set application_id = v_keep
     where application_id in (select id from public.applications
                               where candidate_id = g.candidate_id and pipeline = g.pipeline and status = 'em_processo' and id <> v_keep);
    delete from public.applications
     where candidate_id = g.candidate_id and pipeline = g.pipeline and status = 'em_processo' and id <> v_keep;
  end loop;
end $$;

alter table public.applications enable trigger applications_log;
alter table public.applications enable trigger applications_stage_timestamp;

-- A regra antiga (uma candidatura por vaga) dá lugar a: um card em aberto por pessoa e funil
alter table public.applications drop constraint if exists applications_candidate_job_unique;
create unique index if not exists applications_one_open_per_pipeline
  on public.applications (candidate_id, pipeline) where status = 'em_processo';
create index if not exists applications_status_idx on public.applications (status, closed_at desc);

-- --------------------------------------------------------------
-- 4) Vaga principal sempre igual à primeira da lista (agenda, IA e painel usam)
-- --------------------------------------------------------------
create or replace function public.applications_sync_jobs()
returns trigger language plpgsql as $$
begin
  if new.jobs is null or jsonb_typeof(new.jobs) <> 'array' or jsonb_array_length(new.jobs) = 0 then
    new.jobs := jsonb_build_array(jsonb_build_object('id', new.job_id, 'title', new.job_title));
  elsif tg_op = 'INSERT' or new.jobs is distinct from old.jobs then
    -- Só quando a lista muda (uma vaga apagada no site zera o job_id sem mexer na lista)
    new.job_id    := (select j.id from public.jobs j where j.id::text = new.jobs->0->>'id');
    new.job_title := coalesce(new.jobs->0->>'title', new.job_title);
  end if;
  return new;
end;
$$;

drop trigger if exists applications_sync_jobs on public.applications;
create trigger applications_sync_jobs before insert or update of jobs, job_id, job_title on public.applications
  for each row execute function public.applications_sync_jobs();

-- Cards juntados acima: alinha a vaga principal com a primeira da lista
update public.applications a
   set job_title = a.jobs->0->>'title',
       job_id    = (select j.id from public.jobs j where j.id::text = a.jobs->0->>'id')
 where a.job_title is distinct from a.jobs->0->>'title';

-- --------------------------------------------------------------
-- 5) Resultado: data de fechamento e histórico
-- --------------------------------------------------------------
create or replace function public.applications_stage_timestamp()
returns trigger language plpgsql as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  if new.status is distinct from old.status then
    new.closed_at := case when new.status = 'em_processo' then null else now() end;
    if new.status <> 'reprovado' then new.rejection_reason := null; end if;
  end if;
  return new;
end;
$$;

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
  else
    if new.stage is distinct from old.stage then
      insert into public.application_events (application_id, kind, from_stage, to_stage, actor)
      values (new.id, 'etapa', old.stage, new.stage, public.rh_actor());
    end if;
    if new.status is distinct from old.status then
      insert into public.application_events (application_id, kind, from_stage, to_stage, actor, detail)
      values (new.id, 'status', old.status, new.status, public.rh_actor(),
        case when new.status = 'reprovado' then new.rejection_reason end);
    end if;
  end if;
  return null;
end;
$$;

-- --------------------------------------------------------------
-- 6) Configurações do RH: motivos de reprovação e roteiro de entrevista.
--    Tabela própria e PRIVADA (site_settings é lida pelo site público, e o
--    roteiro de entrevista não deve ficar visível para candidatos).
-- --------------------------------------------------------------
create table if not exists public.rh_settings (
  id                smallint primary key default 1,
  rejection_reasons text[] not null default array[
    'Na avaliação de perfil',
    'Não compareceu na entrevista',
    'Na entrevista (scorecard)',
    'Na aula-teste',
    'Localização',
    'Falta de resposta',
    'Desistiu do processo',
    'No onboarding',
    'No treinamento',
    'Pertence ao outro funil',
    'Outro motivo'
  ],
  interview_script  jsonb not null default '{
    "sections": [
      { "title": "Apresentação", "questions": [
        { "q": "Como é a sua rotina do início ao fim do dia?", "hint": "Demonstra proatividade" },
        { "q": "Quais os seus princípios de vida?", "hint": "Demonstra fit cultural" },
        { "q": "Descreva o ambiente de trabalho em que você seria mais produtivo e feliz", "hint": "Demonstra fit cultural" },
        { "q": "Como você se deslocaria até aqui todos os dias?", "hint": "Demonstra disponibilidade" },
        { "q": "Você tem filhos?", "hint": "Demonstra responsabilidade e prioridades" }
      ] },
      { "title": "Competências técnicas", "questions": [
        { "q": "Qual é a sua experiência na área?", "hint": "Demonstra competência técnica" },
        { "q": "Qual foi o seu último emprego e por que saiu de lá?", "hint": "Demonstra respeito e perfil profissional" }
      ] },
      { "title": "Competências comportamentais", "questions": [
        { "q": "Qual foi o melhor líder que você já teve? O que aprendeu com ele?", "hint": "Demonstra respeito e o que desperta admiração ou detração" },
        { "q": "Você se considera um líder?", "hint": "" },
        { "q": "Qual foi o maior desafio que você já enfrentou na vida?", "hint": "Demonstra resiliência ou fraqueza" },
        { "q": "O que faria você deixar o emprego imediatamente?", "hint": "Demonstra instabilidades emocionais" },
        { "q": "O que você considera sua maior qualidade?", "hint": "Demonstra resiliência ou fraqueza · Demonstra humildade" },
        { "q": "O que você considera que mais tem que melhorar?", "hint": "Demonstra humildade" },
        { "q": "Qual sua principal motivação?", "hint": "Demonstra visão de futuro" },
        { "q": "Onde você se vê nos próximos anos?", "hint": "Demonstra visão de futuro" }
      ] }
    ]
  }'::jsonb,
  updated_at        timestamptz not null default now(),
  constraint rh_settings_single_row check (id = 1)
);

insert into public.rh_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists rh_settings_set_updated_at on public.rh_settings;
create trigger rh_settings_set_updated_at before update on public.rh_settings
  for each row execute function public.set_updated_at();

alter table public.rh_settings enable row level security;
drop policy if exists "admin full access rh settings" on public.rh_settings;
create policy "admin full access rh settings" on public.rh_settings
  for all to authenticated using (true) with check (true);
