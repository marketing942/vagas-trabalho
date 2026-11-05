# Pesquisa de mercado: sistemas de recrutamento e seleção (ATS)

_CPPEM · novembro de 2026_

Objetivo: comparar o nosso sistema de RH com os principais do mercado e
definir o que vale trazer, **sem deixar o sistema complexo**. O sistema é só
para o CPPEM, então o foco é o que ajuda a nossa equipe a contratar melhor e
mais rápido, e não recursos de quem vende para centenas de empresas.

> Limitações: a pesquisa usou busca na web. O site da Sólides não pôde ser
> aberto diretamente desta sessão, por bloqueio de rede, então as informações
> dela vêm dos resultados de busca. Muitas fontes são material de marketing
> dos próprios fornecedores; os números que eles divulgam (precisão de IA etc.)
> não foram verificados de forma independente.

---

## 1. Quem foi analisado

| Sistema | Origem | Pontos fortes (segundo as fontes) |
| --- | --- | --- |
| **Sólides** | Brasil | Mapeamento comportamental próprio (**Profiler**, baseado em DISC) dentro do ATS; "Engenharia de Cargos" (perfil ideal da vaga); **Matcher** (candidato x vaga); integração nativa com **WhatsApp** para mensagens e agendamento; divulgação em portais. Críticas recorrentes: suporte pós-venda, integrações e banco de currículos. |
| **Gupy** | Brasil | IA de triagem (Gaia, hoje "agentes de IA") que **ordena** candidatos por aderência, com pesos ajustáveis por vaga; foco em **devolutiva**: caixa de feedback ao reprovar, envio em massa por WhatsApp, aviso para dar retorno ao encerrar vaga, filtro "sem feedback" e painel de experiência do candidato. Críticas: processos longos e feedbacks rasos. |
| **InHire** | Brasil | Agentes de IA para triagem, **transcrição de entrevistas**, candidatura via WhatsApp, kanban, aprovação de vagas por gestores. |
| **Recrutei, Abler, Pandapé, JobConvo** | Brasil | Kanban, banco de talentos, testes **DISC** (com IA no caso da Abler), chatbot/candidatura por WhatsApp, entrevista em vídeo. |
| **Greenhouse** | EUA | Referência em **contratação estruturada**: kits de entrevista (perguntas e critérios definidos antes), **scorecards** por critério, visão consolidada das avaliações, modelos de e-mail de reprovação. |
| **Ashby** | EUA | **IA de revisão de candidaturas por critérios** definidos na vaga, com **evidência citada** para cada critério e possibilidade de corrigir a IA; analytics forte. |
| **Teamtailor** | Europa | **Automações por gatilho** (ao entrar numa etapa: enviar mensagem, mover, agendar); Co-pilot de IA que escreve mensagens, resume currículos e **sugere perguntas de entrevista**; experiência do candidato. |
| **Workable** | EUA | Divulgação em centenas de portais e busca ativa de candidatos com IA. |

## 2. O que a ciência e a lei dizem (e que muda o desenho)

1. **Entrevista estruturada é o que mais prevê desempenho.** Na revisão de
   Sackett et al. (2022) das meta-análises de seleção, a entrevista
   estruturada ficou em **1º lugar** (validade ≈ 0,42), bem acima da não
   estruturada (≈ 0,19). Testes de personalidade, como conscienciosidade,
   ficaram bem abaixo (≈ 0,19). **Conclusão:** o nosso roteiro padrão com
   critérios e notas é o investimento certo; vale reforçá-lo, por exemplo
   ligando cada pergunta a um critério.
2. **Testes de perfil comportamental tipo DISC/Profiler:** são populares, mas
   o Conselho Federal de Psicologia e o CRP-SP não os recomendam para seleção
   por falta de validação, e a Lei 4.119/1962 reserva aos psicólogos o uso de
   **testes psicológicos** em seleção. **Conclusão:** não vamos criar um "teste
   de personalidade" próprio. O perfil comportamental entra de três formas:
   - entrevista comportamental estruturada, que já temos;
   - **questionário situacional da cultura CPPEM**: cenários reais do dia a dia
     com respostas alinhadas aos 10 mandamentos. É uma avaliação de cultura, não
     um teste psicológico;
   - análise da IA sobre as respostas, como copiloto.

   Se um dia quiserem o Profiler ou outro teste formal, o caminho é aplicá-lo
   com psicólogo responsável ou pela ferramenta do fornecedor, e anexar o
   resultado na ficha.
3. **IA em seleção é "alto risco"** no PL 2338/2023, o marco da IA: exige
   **supervisão humana** e avaliação de impacto. O nosso desenho já segue isso:
   - a IA só organiza evidências e a decisão é humana;
   - há regras contra vieses;
   - a Política de Privacidade avisa o candidato.

   Vamos manter assim: **a IA sugere, a equipe decide e pode corrigir**.
4. **LGPD:** banco de talentos precisa de consentimento e **prazo definido**.
   Para quem não foi selecionado, o mercado usa 6 a 24 meses. A nossa política
   diz 2 anos, mas hoje o sistema **não apaga sozinho**. Isso precisa de uma
   rotina de limpeza.

## 3. Comparação: o que já temos x mercado

| Recurso | Mercado | CPPEM hoje |
| --- | --- | --- |
| Formulário próprio, várias vagas | Todos | ✅ |
| Triagem por IA com critérios e evidências | Gupy, Ashby, InHire | ✅ (DeepSeek, nota por vaga, regras de justiça) |
| Kanban com etapas e ganho/perda | Todos | ✅ |
| Motivos de reprovação | Todos | ✅ configuráveis |
| Kit/roteiro de entrevista e scorecard | Greenhouse, Teamtailor | ✅ roteiro editável + 5 critérios |
| Agendamento pelo próprio candidato | Sólides, Teamtailor | ✅ link pessoal e geral |
| Painel de indicadores | Ashby, todos | ✅ (funil, conversão, origem) |
| **Modelos de mensagem por etapa (WhatsApp/e-mail)** | Sólides, Gupy, Teamtailor | ⚠️ só o convite |
| **Devolutiva ao reprovado, inclusive em massa** | Gupy | ❌ |
| **Alertas de candidato parado / pendências** | Greenhouse, Ashby | ⚠️ só filtro "parado há X dias" |
| **Prévia rápida do candidato sem sair do quadro** | Ashby, Teamtailor | ❌ |
| **IA copiloto na entrevista** (resumo, sugestão de notas) | InHire, Greenhouse, Teamtailor | ❌ |
| **Comparar finalistas lado a lado** | Greenhouse, Ashby | ❌ |
| **Questionário de cultura / perfil comportamental** | Sólides, Recrutei | ❌ |
| **Perguntas eliminatórias por vaga** | Todos | ❌ |
| Tempo por etapa e origem dos contratados | Ashby, Greenhouse | ⚠️ parcial |
| Limpeza automática LGPD | (boa prática) | ❌ |

Não vamos trazer (complexidade sem retorno para uma empresa só):
- divulgação em 200 portais;
- busca ativa em bases externas;
- aprovação de vagas por vários gestores;
- permissões por perfil;
- integração com folha de pagamento;
- vídeo-entrevista gravada.

## 4. Plano de desenvolvimento (passo a passo)

### Fase 1 — rotina do dia a dia (começa agora)
1. **Modelos de mensagem** (Configurações → RH):
   - convite, confirmação, lembrete, aprovação e devolutiva de reprovação;
   - variáveis como {nome}, {vagas} e {link_agenda};
   - na ficha, o menu WhatsApp passa a oferecer esses modelos.
2. **Devolutiva ao reprovar:** depois de escolher o motivo, o sistema oferece
   a mensagem pronta e registra que a devolutiva foi enviada. Em Finalizados
   entram o filtro **"sem devolutiva"** e o envio um a um em sequência, como
   faz a Gupy.
3. **Central de pendências** no painel e no pipeline:
   - parados há mais de N dias por etapa;
   - entrevistas que já passaram sem resultado;
   - reprovados sem devolutiva;
   - avaliações da IA com erro.
4. **Prévia rápida no pipeline:** clicar no card abre um painel lateral com o
   resumo, as vagas, o score, as próximas ações e os botões principais, sem
   sair do quadro.
5. **IA copiloto na entrevista:** a partir das respostas do roteiro, a IA faz
   um resumo, **sugere** as notas 0 a 10 dos 5 critérios com a evidência e
   aponta pontos a confirmar. A equipe aceita ou ajusta.

### Fase 2 — avaliação mais completa
6. **Questionário situacional da cultura CPPEM:** 8 a 10 cenários, enviados
   por link depois da triagem, com nota automática por mandamento e resultado
   na ficha.
7. **Comparar finalistas:** de 2 a 4 pessoas lado a lado, com scores, notas
   da entrevista, pontos fortes e de atenção, e um resumo da IA.
8. **Perguntas eliminatórias por vaga** (ex.: disponibilidade de horário,
   mora em Caruaru, CNH): aparecem no formulário e **sinalizam**, sem reprovar
   sozinhas.

### Fase 3 — gestão e conformidade
9. Relatórios: tempo médio em cada etapa, origem dos contratados e taxa de
   devolutiva.
10. Rotina LGPD: lista de quem passou do prazo de 2 anos e exclusão ou
    anonimização com um clique.

Critério para tudo: **cada recurso novo tem que caber num clique a partir do
pipeline ou da ficha**, sem tela nova obrigatória no dia a dia.

## Fontes

- Sólides: [Recrutamento e seleção](https://solides.com.br/recrutamento-e-selecao/) ·
  [Profiler](https://solides.com.br/solides-profiler/) ·
  [Tudo sobre o Profiler](https://solides.com.br/blog/tudo-sobre-profiler/) ·
  [Avaliações no B2B Stack](https://www.b2bstack.com.br/product/solides/avaliacoes)
- Gupy: [Gaia](https://gupy.io/blog/gaia-inteligencia-artificial-gupy) ·
  [Triagem com agentes de IA](https://www.gupy.io/nova-ordenacao-com-agentes-de-ia) ·
  [O que a Gaia avalia](https://www.gupy.io/blog-do-emprego/o-que-a-gaia-avalia) ·
  [Feedback na prática](https://gupy.io/blog/feedback-na-pratica-gupy) ·
  [O que a Gupy e o RH fazem pela pessoa candidata](https://www.gupy.io/blog/gupy-rh-fazem-pessoa-candidata) ·
  [Tecnoblog: feedbacks rasos](https://tecnoblog.net/especiais/processo-seletivo-longo-e-feedbacks-rasos-o-que-acontece-com-a-gupy/) ·
  [Baguete](https://www.baguete.com.br/public/noticias/gupy-ia-comanda-selecao)
- InHire: [Computer Weekly](https://www.computerweekly.com/br/noticias/366629432/InHire-recebe-investimento-para-acelerar-expansao-nas-maiores-empresas-do-Brasil) ·
  [B2B Stack](https://www.b2bstack.com.br/product/inhire)
- Comparativos BR: [Pandapé x Recrutei](https://www.b2bstack.com.br/compare/pandape-vs-recrutei) ·
  [Recrutei (RankMyAI)](https://www.rankmyai.com/tools/fded7ab5-edca-4761-8acf-1b9711b50f12/recrutei) ·
  [Senior JobConvo](https://documentacao.senior.com.br/seniorxplatform/manual-do-usuario/hcm/ats-jobconvo/conceito) ·
  [Abler DISC.ia](https://www.abcdacomunicacao.com.br/startup-lanca-primeira-ferramenta-que-integra-inteligencia-artificial-ao-tradicionais-testes-disc/)
- Greenhouse: [Scorecards](https://support.greenhouse.io/hc/en-us/articles/4414777492891-Scorecard-overview) ·
  [Structured hiring guide](https://support.greenhouse.io/hc/en-us/articles/360039539772-Structured-hiring-guide) ·
  [E-mails de reprovação](https://support.greenhouse.io/hc/en-us/articles/360025603151-Rejection-emails)
- Ashby: [AI-assisted application review](https://www.ashbyhq.com/blog/product/ai-assisted-application-review) ·
  [Documentação](https://docs.ashbyhq.com/ai-assisted-application-review)
- Teamtailor: [Automações e gatilhos](https://teamtailor.com/en/recruitment-automation-and-triggers/) ·
  [IA no recrutamento](https://teamtailor.com/en/resources/ai-recruiting-software)
- Ciência: [Sackett et al. (2022), resumo](https://academicnewsletter.sufe.edu.cn/info/369297) ·
  [Revisão 2023 (Cambridge)](https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/A20984B138319E3D432E643978BF026D/S175494262300024Xa.pdf/revisiting-the-design-of-selection-systems-in-light-of-new-findings-regarding-the-validity-of-widely-used-predictors.pdf)
- Testes comportamentais: [Gupy, e-book sobre testes de perfil](https://www.gupy.io/hubfs/e-Book-Teste-de-perfil-comportamental-pros-contras-e-quais-utilizar.pdf) ·
  [CFP / Satepsi](https://site.cfp.org.br/tag/satepsi/) ·
  [IPIP (domínio público)](https://ipip.ori.org/newPermission.htm)
- Lei: [PL 2338 e RH](https://www.distrito.me/blog/pl-2338-empresas) ·
  [CGI.br](https://cgi.br/media/atas/pdf/reuniao_do_cgi.br_de_26_de_julho_de_2024_0_28082024.pdf) ·
  [LGPD no recrutamento](https://confidata.com.br/blog/lgpd-rh-dados-colaboradores-recrutamento) ·
  [Migalhas: currículos e LGPD](https://www.migalhas.com.br/depeso/363808/o-tratamento-dos-curriculos-na-lgpd)
- Métricas: [PitchNHire](https://www.pitchnhire.com/recruitment-metrics) ·
  [Noota](https://www.noota.io/en/best-ats-reports-guide)
- WhatsApp: [Preços da plataforma (Meta)](https://developers.facebook.com/docs/whatsapp/pricing)
