-- ==============================================================
-- 0013 — RH: questionário de cultura e perguntas eliminatórias por vaga.
-- Idempotente (pode rodar mais de uma vez). Não mexe nos dados existentes.
-- ==============================================================

-- Resultado do questionário de cultura (respostas, nota geral e por mandamento)
-- e respostas das perguntas eliminatórias da candidatura
alter table public.applications
  add column if not exists culture_quiz jsonb,
  add column if not exists screening    jsonb;

-- Perguntas eliminatórias de cada vaga (sim/não), mostradas no formulário de candidatura.
-- Ex.: [{"id":"q1","question":"Você tem disponibilidade aos sábados?","expected":"sim"}]
alter table public.jobs
  add column if not exists screening_questions jsonb not null default '[]'::jsonb;
