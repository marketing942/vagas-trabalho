/**
 * Conteúdo da página /cultura (do documento "Implementação de Nova Cultura Empresarial").
 * Para mudar um texto, edite aqui: a página se atualiza sozinha.
 */

export const CULTURA_DEFINICAO =
  "Trate a nossa cultura como um sistema imunológico que “expele” pessoas que não se alinham com os valores da empresa.";

/** Frase que resume os 3 valores. */
export const VALORES_FRASE =
  "Nossa fé nos mantém firmes, nossa disciplina nos faz avançar e nossa proatividade nos coloca à frente.";

export interface Valor {
  titulo: string;
  texto: string;
}

/** Os 3 valores do CPPEM: cada um é um checkpoint na montanha da página. */
export const VALORES: Valor[] = [
  {
    titulo: "Fé Inabalável",
    texto: "Diante da realidade nua e crua, nunca recuamos ou desistimos.",
  },
  {
    titulo: "Disciplina",
    texto:
      "Vontade inabalável de fazer o que precisa ser feito. Significa uma determinação quase estoica de fazer o que for necessário para tornar a empresa excelente, mesmo quando ninguém está olhando.",
  },
  {
    titulo: "Proatividade",
    texto: "Não espera ordem. Enxerga o problema antes que vire crise e age enquanto os outros ainda percebem.",
  },
];

/**
 * Os 10 mandamentos antigos. Não aparecem mais na página /cultura (agora são os 3 valores acima),
 * mas o questionário de cultura e a triagem por IA ainda usam esta lista.
 */
export const MANDAMENTOS: string[] = [
  "Tenha uma mente milionária e pense grande.",
  "Foque no cliente e na realização do sonho.",
  "Busque maior lucratividade com eficiência.",
  "Não deixe para depois o que pode fazer hoje.",
  "Agilidade é mais importante do que perfeição.",
  "Não cumpra apenas o horário, cumpra metas.",
  "Estude e inove constantemente.",
  "Trate a empresa como sendo sua.",
  "Seja sincero e direto com seus pares e assuma seus erros.",
  "Siga os processos e faça tudo por escrito.",
];

/** "A forma como agimos": cada item completa a frase (ex.: "A forma como agimos: ética e lealdade"). */
export const COMO_AGIMOS: string[] = [
  "Ética e lealdade",
  "Proatividade para resolver sem enrolar",
  "Gosto por aprender",
  "Fome de crescimento",
  "Gosto por desafios",
  "Trabalho e vitória em equipe",
  "Responsabilidade pelas nossas ações",
];

/** "A forma como NÃO agimos". */
export const COMO_NAO_AGIMOS: string[] = [
  "Falsidade e deslealdade",
  "Procrastinação: deixar para depois",
  "Vitimismo: “se explicar” mais do que entregar",
  "Aceitar a mediocridade",
  "Medo de crescer",
  "Desistir fácil quando a dificuldade aperta",
  "Esconder o erro e não se responsabilizar",
];

