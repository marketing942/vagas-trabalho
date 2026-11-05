-- ==============================================================
-- 0012 — RH: modelos de mensagem, devolutiva aos candidatos e
--         análise da entrevista pela IA (copiloto).
-- Idempotente (pode rodar mais de uma vez).
-- ==============================================================

-- Quando a devolutiva foi enviada (para quem foi reprovado) e a análise da IA sobre a entrevista
alter table public.applications
  add column if not exists feedback_sent_at timestamptz,
  add column if not exists interview_ai     jsonb;

create index if not exists applications_feedback_idx on public.applications (status, feedback_sent_at);

-- Modelos de mensagem (WhatsApp). Variáveis: {primeiro_nome} {nome} {vagas}
-- {link_agenda} {data_entrevista} {local}
alter table public.rh_settings
  add column if not exists message_templates jsonb not null default '[
    {
      "key": "convite",
      "label": "Convite para entrevista",
      "text": "Olá, {primeiro_nome}! Aqui é do RH do CPPEM. Gostamos do seu perfil para {vagas} e queremos conhecer você. Escolha o melhor dia e horário para a sua entrevista neste link: {link_agenda}"
    },
    {
      "key": "lembrete",
      "label": "Lembrete da entrevista",
      "text": "Oi, {primeiro_nome}! Passando para lembrar da sua entrevista no CPPEM: {data_entrevista}, em {local}. Chegue com 10 minutos de antecedência. Qualquer imprevisto, é só responder aqui."
    },
    {
      "key": "aprovado",
      "label": "Aprovação",
      "text": "Parabéns, {primeiro_nome}! Você foi aprovado(a) no processo seletivo do CPPEM para {vagas}. Vamos combinar os próximos passos por aqui."
    },
    {
      "key": "devolutiva",
      "label": "Devolutiva (não seguiu no processo)",
      "text": "Olá, {primeiro_nome}! Obrigado por participar do processo seletivo do CPPEM para {vagas}. Neste momento seguimos com outros perfis, mas gostamos de conhecer você e seu cadastro continua no nosso banco de talentos para próximas oportunidades. Desejamos muito sucesso!"
    },
    {
      "key": "devolutiva_entrevista",
      "label": "Devolutiva após entrevista",
      "text": "Olá, {primeiro_nome}! Obrigado pelo seu tempo na entrevista para {vagas}. Depois de avaliar com cuidado, decidimos seguir com outro perfil desta vez. Foi muito bom conhecer você e vamos lembrar do seu nome nas próximas vagas. Sucesso!"
    }
  ]'::jsonb;
