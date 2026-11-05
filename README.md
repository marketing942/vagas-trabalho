# CPPEM Carreiras

Sistema de **Vagas, Carreiras e RH** do **CPPEM Colégio e Cursos**, com:

- **Página pública** (`/carreiras`) — hero institucional, indicadores, busca e filtros, cards de vagas e página de detalhes.
- **Formulário de candidatura próprio** (`/candidatura`) — as mesmas perguntas do formulário do Notion, com envio de currículo. Ao enviar, a pessoa já fica inscrita no processo seletivo.
- **Área de RH** (`/admin`) — pipeline de candidatos (funis de Trabalho e de Professores), ficha do candidato, scorecard de IA, scorecard da entrevista, agenda de entrevistas e painel de dados.
- **Agendamento de entrevistas** (`/agenda`) — link que o RH envia para o candidato escolher dia e horário; a entrevista entra direto no calendário.

> Enquanto o formulário próprio estiver **desligado** (padrão), os botões "Candidatar-se" continuam indo para o **formulário do Notion**. Ligue em **Admin → Configurações → Candidaturas pelo site** depois de seguir o passo a passo abaixo.

---

## 🧱 Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS 3
- [Supabase](https://supabase.com/) (Postgres + Auth + RLS)
- Deploy na [Vercel](https://vercel.com/)

---

## 📁 Estrutura do projeto

```
src/
  app/
    page.tsx                      → redireciona para /carreiras
    carreiras/page.tsx            → página pública de vagas
    carreiras/[slug]/page.tsx     → detalhes da vaga
    admin/layout.tsx              → força renderização dinâmica do admin
    admin/login/page.tsx          → login (Supabase Auth)
    admin/dashboard/page.tsx      → métricas e resumos
    admin/vagas/page.tsx          → listagem + ações
    admin/vagas/nova/page.tsx     → nova vaga
    admin/vagas/[id]/editar       → editar vaga
    admin/configuracoes/page.tsx  → textos, indicadores, redes, formulário
    admin/candidatos/             → pipeline, ficha do candidato, importar do Notion
    admin/agenda/page.tsx         → calendário de entrevistas e disponibilidade
    candidatura/page.tsx          → formulário de candidatura
    agenda/page.tsx               → link de agendamento de entrevista
    api/candidatura, api/agenda   → gravam candidaturas e entrevistas (servidor)
    api/admin/avaliar             → (re)avalia uma candidatura com IA
  components/                     → JobCard, JobFilters, JobDetails, Hero,
                                    StatsSection, AboutSection, LinkedInCard,
                                    Footer, Header, Logo, JobsExplorer,
                                    admin/AdminLayout, admin/AdminJobForm,
                                    admin/RichTextEditor
  lib/
    supabase/client.ts            → cliente browser (anon key)
    supabase/server.ts            → cliente server (cookies)
    types.ts, constants.ts        → tipos e opções (setores, unidades, etc.)
    jobs.ts, settings.ts          → acesso aos dados
    rh/                           → etapas, IA, agenda, validação, importação
    slug.ts                       → geração de slug
  proxy.ts                        → protege rotas /admin
supabase/migrations/           → schema, RLS, configurações, vagas e RH (0001–0010)
.env.example
```

---

## 🚀 Como rodar localmente

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente** (veja a próxima seção):

   ```bash
   cp .env.example .env.local
   # edite .env.local com os dados do seu projeto Supabase
   ```

3. **Rode o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

   Acesse:
   - Página pública: <http://localhost:3000/carreiras>
   - Admin: <http://localhost:3000/admin>

> Sem as variáveis do Supabase, a página pública abre normalmente (sem vagas) e o admin redireciona para o login.

---

## 🔐 Como configurar o Supabase

1. Crie um projeto em <https://supabase.com>.

2. Abra **SQL Editor → New query** e rode os arquivos de
   [`supabase/migrations`](supabase/migrations) **em ordem** (0001 → 0002 → 0003
   → 0004), colando e dando **RUN** em cada um:
   - `0001_init.sql` — tabelas `jobs` e `site_settings`, RLS, triggers e
     configurações iniciais.
   - `0002_rebrand_links.sql` — ajuste dos links sociais (Linktree por marca).
   - `0003_footer_contact.sql` — CNPJ, endereço, link do mapa e grupo de WhatsApp.
   - `0004_seed_jobs.sql` — cadastra as vagas de Trabalho atuais.
   - `0005_seed_professors.sql` — cadastra as vagas de Professores e adiciona
     o link de candidatura por vaga (`apply_url`).
   - `0006_multi_units.sql` — atualiza as vagas que atendem a mais de uma
     unidade (uma vaga pode ter várias unidades).
   - `0007_featured.sql` — adiciona o destaque de vaga (`featured`), que faz a
     vaga aparecer em primeiro na listagem.
   - `0008_configurable_lists.sql` — setores e unidades editáveis no admin.
   - `0009_closed_jobs_and_content.sql` — libera a leitura pública de vagas
     **encerradas** (a página mostra "vaga encerrada" em vez de erro 404) e cria
     os textos editáveis das seções e o e-mail de privacidade.
   - `0010_rh.sql` — sistema de RH: candidatos, candidaturas, histórico,
     entrevistas, disponibilidade da agenda e o bucket **privado** `curriculos`
     para os currículos.

   > Em uma instalação nova, rodar todos em ordem deixa o banco completo. As
   > migrations são idempotentes (podem ser executadas novamente sem duplicar).

3. **Crie o usuário administrador** (para acessar o `/admin`):
   - Vá em **Authentication → Users → Add user**.
   - Informe e-mail e senha (ex.: `administrador@cppem.com.br`).
   - Marque para confirmar o e-mail automaticamente (ou confirme manualmente).

   > O login usa **e-mail + senha**. Não há cadastro público de usuários — apenas
   > usuários criados no painel do Supabase conseguem entrar no admin.

4. Pegue as chaves em **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Modelo de segurança (RLS)

| Tabela                                   | Público (anônimo)                       | Autenticado (admin) |
| ---------------------------------------- | --------------------------------------- | ------------------- |
| `jobs`                                   | lê vagas abertas e encerradas           | CRUD completo       |
| `site_settings`                          | leitura                                 | leitura + edição    |
| `candidates`, `applications`, `application_events`, `interviews` | **nada** (nem lê, nem grava) | CRUD completo       |
| Storage `curriculos` (privado)           | **nada**                                | lê (links temporários), envia e apaga |

O navegador usa apenas a **anon key**. O formulário de candidatura e o link de
agendamento gravam pelo **servidor** (rotas `/api/candidatura` e `/api/agenda`)
com a `service_role`, que nunca vai para o navegador. A reserva de horário é
feita por uma função no banco (`book_interview`) que impede duas pessoas de
pegarem o mesmo horário.

---

## ⚙️ Variáveis de ambiente

Crie um arquivo `.env.local` (use `.env.example` como base):

| Variável                        | Obrigatória | Descrição                                            |
| ------------------------------- | ----------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅          | URL do projeto Supabase                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅          | Chave pública (anon) do Supabase                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅ para o RH | Só no servidor. Necessária para o formulário de candidatura e o agendamento de entrevistas |
| `DEEPSEEK_API_KEY`              | ❌          | Scorecard de IA (DeepSeek, modelo `deepseek-chat`). Sem ela, as candidaturas ficam aguardando avaliação |
| `DEEPSEEK_MODEL`                | ❌          | Troca o modelo (ex.: `deepseek-reasoner`). Padrão: `deepseek-chat` |
| `NEXT_PUBLIC_SITE_URL`          | ❌          | Endereço público (ex.: `https://vagas.cppem.com.br`) para sitemap, imagens de compartilhamento e dados de vaga. Sem ele, usa o domínio de produção da Vercel |

---

## 🔎 Google, compartilhamento e medição

- **Google Vagas:** cada vaga aberta publica dados estruturados (`JobPosting`),
  e há `sitemap.xml` e `robots.txt` automáticos. Vagas encerradas e rascunhos
  não são indexados.
- **Pré-visualização de links:** ao colar o link no WhatsApp/Instagram aparece
  uma imagem com as logos e o título da vaga (gerada automaticamente).
- **Medição:** o site usa o Vercel Web Analytics (sem cookies). Para ver os
  números, abra o projeto na Vercel → aba **Analytics** → **Enable**. Os cliques
  em "Candidatar-se", WhatsApp, LinkedIn e "Compartilhar" são enviados como
  eventos; a contagem de eventos depende do plano da Vercel.
- **Página de cultura (`/cultura`):** os 10 mandamentos e as listas de quem é e de
  quem não é bem-vindo ficam em `src/lib/cultura.ts`. Os mandamentos aparecem como
  uma subida: ao rolar a página, um ponto avança pela trilha de uma montanha (um
  checkpoint por mandamento) até a bandeira TOPO. O desenho da montanha e da
  trilha fica em `src/lib/cultura-trilha.ts`.
- **Textos editáveis:** em Admin → Configurações é possível editar "Por que
  trabalhar no CPPEM", "Como funciona" e "Perguntas frequentes". O texto da
  Política de Privacidade fica em `src/app/privacidade/page.tsx`; o e-mail de
  contato dela é o campo "E-mail para pedidos de privacidade" nas Configurações.

---

## ☁️ Como publicar na Vercel

1. Suba o repositório para o GitHub.
2. Em <https://vercel.com>, clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**. A Vercel detecta o Next.js automaticamente.
5. Após o deploy, acesse `https://SEU-DOMINIO.vercel.app/carreiras`.

---

## 🧑‍💼 Sistema de RH

### Como ligar (uma vez)

1. Rode no SQL Editor do Supabase, nessa ordem, `supabase/migrations/0010_rh.sql`,
   `0011_rh_status_vagas_roteiro.sql`, `0012_rh_mensagens_copiloto.sql` e
   `0013_rh_cultura_eliminatorias.sql`.
2. Na Vercel → **Settings → Environment Variables**, adicione:
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → `service_role`);
   - `DEEPSEEK_API_KEY` (opcional, para o scorecard de IA; crie em platform.deepseek.com → API keys e coloque saldo).
   Depois clique em **Redeploy**.
3. Em **Admin → Configurações → Candidaturas pelo site**, confira a lista
   (tudo com ✓), teste em `/candidatura?teste=1` e marque **Receber candidaturas
   pelo formulário do site**. Salve.
4. (Opcional) Em **Admin → Candidatos → Importar do Notion**, envie os CSVs
   exportados do Notion (ATS e Candidatos a professores) para trazer o histórico.

### Formulário de candidatura (`/candidatura`)

As mesmas perguntas do formulário do Notion: vaga(s) (pode marcar mais de uma,
incluindo **Banco de Talentos**), nome completo, e-mail, WhatsApp, Instagram ou
LinkedIn, idade, cidade, currículo (opcional; PDF, Word ou imagem até 4 MB, limite de envio da Vercel),
descrição sobre a pessoa e "como encontrou a vaga", além do aceite da Política
de Privacidade. Só o currículo é opcional. Quem se candidata de novo com o mesmo
WhatsApp ou e-mail não vira cadastro duplicado: os dados são atualizados e as
vagas novas entram no card que a pessoa já tem.

**Um card por pessoa e funil:** quem escolhe várias vagas tem UM card no funil
de Trabalho (e um no de Professores, se escolheu vaga de professor), com todas
as vagas nele. A IA avalia o card contra todas as vagas escolhidas.

### Pipeline (`/admin/candidatos`)

- Dois funis: **Trabalho** (Não avaliado, Avaliado por IA, Convite enviado,
  Entrevista agendada, Entrevista realizada, Onboarding, Treinamento, Possivelmente
  depois) e **Professores** (Não avaliado, Visto, Avaliado por IA, Convite enviado,
  Entrevista/aula-teste agendada, Entrevista realizada, Banco para o próximo ano).
  As etapas ficam em `src/lib/rh/constants.ts`.
- A IA avalia cada candidatura nova sozinha e move o card para "Avaliado por IA";
  a equipe trabalha daí em diante. Se uma avaliação ficar presa, o pipeline tenta
  de novo sozinho; se der erro, o card avisa e dá para reavaliar na ficha.
- Cada card mostra as vagas da pessoa, o score da IA em barra de progresso (e a
  nota da entrevista, quando houver), há quanto tempo está na etapa e a entrevista
  marcada.
- **Filtros:** busca (nome, e-mail, WhatsApp, cidade ou vaga), vaga, score da IA,
  recomendação da IA, nota da entrevista, entrevista marcada, cidade, idade, como
  encontrou a vaga, canal de entrada, currículo, data da candidatura, tempo parado
  na etapa, quantidade de vagas e erros da IA. Sete ordenações.
- Arraste o card para mudar de etapa (ou use o menu ⋯).

### Resultado: Contratado, Reprovado e Desligado (`/admin/candidatos/finalizados`)

Não são etapas: são o **resultado** do processo, como "ganho" e "perdido" num CRM.
Ao arrastar um card aparecem as áreas **Contratado** e **Reprovado** (ou use o
menu ⋯ / os botões da ficha). Reprovar exige um motivo da lista configurada. O
card sai do pipeline e vai para **Finalizados**, que tem números próprios (taxa
de contratação, tempo até contratar, permanência), motivos de reprovação, em que
etapa as pessoas saíram e a lista com filtros. Lá dá para **Desligar** um
contratado ou **Reabrir** um processo (volta para a etapa em que estava).

### Rotina do dia a dia

- **Prévia rápida:** no pipeline, clicar no nome abre um painel lateral com o
  essencial (vagas, etapa, score e resumo da IA, entrevista marcada) e as ações
  WhatsApp, Contratar, Reprovar e Abrir ficha completa.
- **Mensagens prontas no WhatsApp:** convite, lembrete, aprovação e devolutiva,
  com variáveis como {primeiro_nome}, {vagas}, {link_agenda} e {data_entrevista}.
  O texto pode ser ajustado antes de enviar e tudo fica no histórico.
- **Devolutiva:** ao reprovar, o sistema oferece a devolutiva pronta. Em
  Finalizados há o filtro "sem devolutiva" e o envio em sequência.
- **Pendências** (no Painel):
  - atrasados por etapa (prazos em `STAGE_SLA_DAYS`, em `src/lib/rh/constants.ts`);
  - entrevistas que já passaram sem resultado;
  - reprovados sem devolutiva;
  - erros da IA.

  No pipeline, o card atrasado ganha um selo, e há o filtro "Passou do prazo".
- **Copiloto da entrevista:** com o roteiro preenchido, a IA resume a entrevista
  e **sugere** as 5 notas com a evidência de cada uma, além de pontos a
  confirmar. Respostas sobre filhos ou família nunca entram nas notas. A equipe
  decide se usa as notas sugeridas.

### Avaliação mais completa (fase 2)

- **Questionário de cultura** (`/questionario?c=…`, link pessoal):
  - 10 situações do dia a dia, uma por mandamento;
  - nota de 0 a 100 e de 0 a 3 por mandamento, calculada no servidor (a pontuação
    das alternativas nunca vai para o navegador);
  - responde uma vez só;
  - o envio é pelo modelo de mensagem "Questionário de cultura";
  - o resultado aparece na ficha (aba Avaliação), no card ("Cultura") e nos filtros;
  - **não é teste psicológico**: mostra como a pessoa diz que agiria, e vale
    confirmar na entrevista. As situações ficam em `src/lib/rh/culture-quiz.ts`
    e a pontuação em `culture-quiz-scores.ts`.
- **Perguntas eliminatórias por vaga** (sim/não, até 5, no cadastro da vaga):
  - aparecem no formulário para quem escolhe a vaga;
  - quem responde diferente do esperado **não é reprovado automaticamente**:
    o card ganha o aviso "Não atende" e aparece no filtro;
  - a IA também recebe as respostas.
- **Comparar finalistas**: no menu ⋯ do card, "Adicionar à comparação" (2 a 4
  pessoas) e depois **Comparar**. A página mostra chance, triagem, cultura,
  entrevista por critério, eliminatórias e pontos fortes e de atenção, com
  o melhor de cada linha em verde e um **resumo comparativo da IA**.

A pesquisa de mercado que orientou estas melhorias e as próximas fases está em
[`docs/pesquisa-mercado-ats.md`](docs/pesquisa-mercado-ats.md).

### Configurações do RH (`/admin/configuracoes/rh`)

- **Motivos de reprovação:** adicionar, renomear, reordenar e remover.
- **Modelos de mensagem** do WhatsApp.
- **Roteiro padrão de entrevista:** partes, perguntas e "o que a pergunta avalia".
  Na ficha de cada candidato o roteiro aparece pronto para preencher as respostas,
  e pode ser ajustado só para aquela pessoa (mudar, tirar ou incluir perguntas,
  ou trazer as perguntas sugeridas pela IA).
- Ficam na tabela privada `rh_settings` (só o admin lê; candidatos não veem).

### Scorecard de IA

Cada candidatura nova é avaliada automaticamente pela IA da **DeepSeek** contra os requisitos e
responsabilidades daquela vaga e contra a cultura (10 mandamentos): score de 0 a
100, recomendação, critérios com evidências, pontos fortes, pontos de atenção,
fit cultural e perguntas sugeridas para a entrevista. O servidor extrai o texto do
currículo em PDF ou Word (.docx) e envia junto; currículo em imagem ou .doc antigo
não é lido pela IA (a equipe vê o arquivo na ficha). Ela é instruída a **nunca** usar idade, gênero, raça,
religião, deficiência, aparência ou origem como critério, e a tratar o texto do
candidato como dado (não como instrução). A decisão é sempre da equipe. O código
fica em `src/lib/rh/ai.ts`.

### Scorecard da entrevista

Os 5 critérios do Notion (Fit Cultural, Proatividade, Comunicação, Resiliência,
Técnica), de 0 a 10, com a média calculada pelo banco igual à fórmula do Notion.

### Agenda (`/admin/agenda` e `/agenda`)

- **Link pessoal**: na ficha, "Enviar convite no WhatsApp" manda a mensagem com o
  link do candidato. Ele escolhe um horário livre, pode remarcar ou cancelar pelo
  mesmo link, e a candidatura vai para "Entrevista agendada".
- **Link geral** (`/agenda`): qualquer pessoa informa nome e WhatsApp e escolhe o
  horário (não precisa dizer a vaga). Se já for candidata, o sistema reconhece
  pelo WhatsApp e a entrevista entra no card dela.
- Disponibilidade (dias, faixas de horário, duração, antecedência mínima, dias
  bloqueados, local e orientações) em **Admin → Agenda**. Horários no fuso de
  Caruaru.

### Painel (`/admin/dashboard`)

Vagas abertas, candidaturas no período (com variação), pessoas em processo,
entrevistas dos próximos 7 dias, contratações, score médio da IA, candidaturas ao
longo do tempo, por vaga, por etapa e por origem, maiores scores da IA, maior
**chance de contratação** (estimativa que combina a etapa atual, o score da IA e
a nota da entrevista) e próximas entrevistas. Filtros por funil e período.

### Dados pessoais (LGPD)

Os dados ficam no Supabase, acessíveis só para quem tem login no admin. Os
currículos ficam em bucket privado e abrem por links temporários. "Excluir" na
ficha apaga a pessoa, as candidaturas, o histórico, as entrevistas e o currículo.
A Política de Privacidade (`/privacidade`) descreve a coleta, o uso de IA e o
prazo de guarda (até 2 anos após o último envio).

---

## 🗂️ Tipos de vaga

- **Trabalho** — vagas administrativas, comerciais, marketing, tecnologia,
  pedagógico, serviços gerais, etc. Campos: setor, tipo de vaga (presencial/
  híbrido/home office), unidade, local, horário previsto. Campos de conteúdo:
  **Responsabilidades, Requisitos e Qualificações, Benefícios**.
- **Professor** — docência. Campos: categoria (Polivalente ou de Disciplina),
  segmento, unidade, local. Campos de conteúdo: **Descrição da vaga, Requisitos
  e Qualificações, Benefícios**.

> Os campos de conteúdo possuem um editor com **negrito, itálico, listas e
> emojis** (o texto é salvo como HTML e exibido formatado na página da vaga).

As vagas aparecem em dois blocos na página pública: **"Encontre sua vaga de
Trabalho"** e **"Encontre sua vaga de Professor"**. Apenas vagas com status
**Aberta** são exibidas publicamente e aparecem no formulário de candidatura.

---

## 🔗 Links com filtros (para compartilhar)

Os filtros da página de vagas ficam refletidos na URL. Basta filtrar na página e
copiar o link do navegador, ou montar o link na mão. Quem abrir já cai nas vagas
filtradas.

| Parâmetro   | Valores                                                      |
| ----------- | ------------------------------------------------------------ |
| `categoria` | `trabalho` ou `professor`                                    |
| `unidade`   | nome da unidade em minúsculas e com hífen (`cppem-concursos`, `colegio-cppem`, `unicive-caruaru`) |
| `setor`     | nome do setor (`marketing`, `comercial`, `servicos-gerais`)  |
| `modelo`    | `presencial`, `hibrido`, `home-office` ou `terceirizado`     |
| `local`     | local da vaga (`caruaru-pe`)                                 |
| `busca`     | texto livre                                                  |

Exemplos (combine quantos quiser com `&`):

```
/carreiras?categoria=professor
/carreiras?categoria=professor&unidade=colegio-cppem
/carreiras?categoria=trabalho&setor=marketing&modelo=presencial
```

Os filtros funcionam tanto em `/carreiras?...` quanto no endereço raiz do site
(`/?categoria=professor` redireciona para `/carreiras?categoria=professor`).
Para unidade e setor vale também o começo do nome, desde que identifique uma
opção só: `unidade=cppem` → CPPEM Concursos, `unidade=colegio` → Colégio CPPEM,
`unidade=unicive` → Unicive Caruaru.

Valores que não existirem entre as vagas abertas são ignorados, e outros
parâmetros do link (como `utm_source`) são preservados.

> Se você usar um encurtador de links ou redirecionamento externo, confira se
> ele **repassa a query string** (tudo depois do `?`). Se ele descartar, o filtro
> se perde antes de chegar ao site.

---

## 📦 Scripts

| Comando         | Descrição                       |
| --------------- | ------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento     |
| `npm run build` | Build de produção               |
| `npm run start` | Inicia o build de produção      |
| `npm run lint`  | Verifica o código com ESLint    |
