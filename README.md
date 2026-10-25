# CPPEM Carreiras

Sistema completo de **Vagas e Carreiras** do **CPPEM Colégio e Cursos**, com:

- **Página pública** (`/carreiras`) — hero institucional, indicadores, busca e filtros, cards de vagas e página de detalhes com candidatura.
- **Área administrativa** (`/admin`) — autenticada via Supabase Auth, para cadastrar, editar, encerrar, reabrir e excluir vagas, além de gerenciar as configurações do site.

> O sistema **não captura dados de candidatos**. Toda candidatura é direcionada para um **formulário externo do Notion** (link aberto em nova aba).

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
    slug.ts                       → geração de slug
  proxy.ts                        → protege rotas /admin
supabase/migrations/           → schema, RLS, configurações e vagas (0001–0004)
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

| Tabela          | Público (anônimo)            | Autenticado (admin) |
| --------------- | ---------------------------- | ------------------- |
| `jobs`          | lê apenas `status = 'aberta'` | CRUD completo       |
| `site_settings` | leitura                      | leitura + edição    |

A página pública usa apenas a **anon key**. Nenhuma chave sensível é exposta no
client. A `service_role` **não é necessária** para o funcionamento padrão.

---

## ⚙️ Variáveis de ambiente

Crie um arquivo `.env.local` (use `.env.example` como base):

| Variável                        | Obrigatória | Descrição                                            |
| ------------------------------- | ----------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅          | URL do projeto Supabase                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅          | Chave pública (anon) do Supabase                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | ❌          | Apenas server-side, se algum dia for necessário      |
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

## 📝 Formulário de candidatura (Notion)

- Os botões **"Candidatar-se agora"** abrem o formulário do Notion em nova aba
  (URL configurável em **Admin → Configurações → Link do formulário**).
- O sistema **não armazena** nome, e-mail, telefone, currículo ou qualquer dado
  pessoal de candidatos.

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
**Aberta** são exibidas publicamente.

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
