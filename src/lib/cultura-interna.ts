/**
 * Conteúdo da página interna /interno/cultura, vindo do documento
 * "Implementação de Nova Cultura Empresarial" (Notion, última edição em 10/11/2026).
 * Para mudar um texto, edite aqui: a página se atualiza sozinha.
 */

/** Donos da implementação da cultura. */
export const DONOS = ["Itallo Mota", "Mateus Timóteo", "Everton Mota"];

/** O dicionário da cultura: a ordem importa (cada passo leva ao próximo). */
export const DICIONARIO = [
  { id: "simbolos", nome: "Símbolos", def: "o que vemos e reconhecemos", capitulo: true },
  { id: "herois", nome: "Heróis", def: "quem e quais histórias nos inspiram", capitulo: true },
  { id: "praticas", nome: "Práticas", def: "como agimos no dia a dia", capitulo: true },
  // o documento define os rituais, mas ainda não detalha nenhum
  { id: "rituais", nome: "Rituais", def: "o que repetimos juntos com intenção", capitulo: false },
  { id: "valores", nome: "Valores", def: "o que orienta nossas escolhas", capitulo: true },
] as const;

export const SIMBOLOS_DEF =
  "Elementos que podemos ver, ouvir ou reconhecer e que expressam nossa identidade.";

export const SALAS = [
  { tipo: "Sala Comercial", nome: "Campo de batalha" },
  { tipo: "Sala de Reunião", nome: "Sala de Guerra" },
];

export const FRASES = ["Fazemos o que precisa ser feito", "Trabalhamos com a verdade nua e crua"];

/** Capas das edições brasileiras (imagens e páginas do Google Livros). */
export const LIVROS = [
  {
    titulo: "Os 7 hábitos das pessoas altamente eficazes",
    autor: "Stephen Covey",
    capa: "/cultura-interna/livros/7-habitos.webp",
    link: "https://books.google.com/books?id=ZHtzEAAAQBAJ",
  },
  {
    titulo: "Empresas feitas pra vencer",
    autor: "Jim Collins",
    capa: "/cultura-interna/livros/empresas-feitas-pra-vencer.webp",
    link: "https://books.google.com/books?id=AtKdHMEiPg4C",
  },
  {
    titulo: "Nada pode me ferir",
    autor: "David Goggins",
    capa: "/cultura-interna/livros/nada-pode-me-ferir.webp",
    link: "https://books.google.com/books?id=HNWsEAAAQBAJ",
  },
  {
    titulo: "Disciplina é destino",
    autor: "Ryan Holiday",
    capa: "/cultura-interna/livros/disciplina-e-destino.webp",
    link: "https://books.google.com/books?id=DsgHEQAAQBAJ",
  },
];

export const HEROIS = [
  { id: "cultura", nome: "Quem representar melhor a cultura", destaque: true },
  { id: "davi", nome: "Rei Davi", destaque: false },
  { id: "moises", nome: "Moisés", destaque: false },
  { id: "salomao", nome: "Salomão", destaque: false },
];

export const ARISTOCRATAS = [
  "Os mais excelentes e virtuosos, líderes pelo exemplo.",
  "Governam visando o bem coletivo da empresa e da equipe.",
  "Tomam decisões pensando no longo prazo e na sustentabilidade.",
  "A legitimidade vem da competência, ética e serviço.",
  "Promovem mérito, cooperação e desenvolvimento de todos.",
];

export const OLIGARCAS = [
  "Pequeno grupo concentra o poder e as decisões.",
  "Age para manter vantagens e privilégios próprios.",
  "Controla influência, posições e informações estratégicas.",
  "Pode agir com favorecimento e exclusão.",
  "Quer crescer com a diminuição dos outros.",
];

export const PRIORIDADES = [
  { nome: "Empresa", texto: "Primeiro, a empresa." },
  { nome: "Clientes", texto: "Depois, os clientes." },
  { nome: "Nós", texto: "Por fim, quem trabalha na empresa." },
];

export const PRIORIDADES_FECHO = "Benefício para a empresa, para os clientes e para nós.";

export const VALORES_NOTA =
  "Estruturamos os valores e a cultura com base no livro Empresas feitas pra vencer, para melhor objetivação daquilo que pregamos.";
