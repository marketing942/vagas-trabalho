/**
 * Questionário situacional da cultura CPPEM: um cenário do dia a dia para cada mandamento.
 * Não é teste psicológico: mostra como a pessoa diz que agiria em situações reais do trabalho,
 * comparando com a nossa cultura. A pontuação de cada alternativa fica só no servidor
 * (culture-quiz-scores.ts), para não aparecer no navegador do candidato.
 */
export interface QuizQuestion {
  id: string;
  /** Índice do mandamento em MANDAMENTOS (src/lib/cultura.ts) */
  mandamento: number;
  situation: string;
  options: string[];
}

export const QUIZ_VERSION = 1;

export const CULTURE_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    mandamento: 0,
    situation: "Seu gestor pede ideias para aumentar as matrículas de um curso no próximo semestre. O que você faz?",
    options: [
      "Sugiro repetir o que funcionou no semestre passado, sem arriscar.",
      "Proponho uma meta ousada, levanto o que deu certo e trago 2 ou 3 ideias novas com um plano para testar.",
      "Espero alguém com mais experiência sugerir primeiro.",
      "Trago uma ideia nova, mesmo sem pensar em como medir o resultado.",
    ],
  },
  {
    id: "q2",
    mandamento: 1,
    situation: "Um aluno chega irritado na recepção: o material dele atrasou e a prova é na semana que vem. O que você faz?",
    options: [
      "Explico que não é a minha área e peço que ele mande um e-mail.",
      "Peço desculpas, registro a reclamação e informo o prazo padrão.",
      "Acolho, entendo a urgência, busco uma solução na hora (como o material digital) e acompanho até ele receber.",
      "Encaminho para o setor responsável e aviso que vão retornar.",
    ],
  },
  {
    id: "q3",
    mandamento: 2,
    situation: "Você percebe que um processo da sua área gasta muito material e tempo sem necessidade. O que você faz?",
    options: [
      "Continuo fazendo do jeito de sempre, não é problema meu.",
      "Comento com os colegas no intervalo.",
      "Calculo o desperdício e proponho ao gestor um jeito mais simples, mostrando quanto vamos economizar.",
      "Mudo o processo por conta própria, sem avisar ninguém.",
    ],
  },
  {
    id: "q4",
    mandamento: 3,
    situation: "São 17h40, seu expediente acaba às 18h e chega um pedido simples de um aluno, que leva uns 15 minutos. O que você faz?",
    options: [
      "Resolvo agora e deixo o aluno atendido.",
      "Anoto para resolver amanhã cedo.",
      "Deixo para quando sobrar tempo na semana.",
      "Começo hoje e termino amanhã cedo, avisando o aluno do prazo.",
    ],
  },
  {
    id: "q5",
    mandamento: 4,
    situation: "Uma promoção de matrícula acaba amanhã e o post precisa sair hoje, mas a arte ainda não está perfeita. O que você faz?",
    options: [
      "Seguro a publicação até ficar perfeita, mesmo perdendo o prazo.",
      "Publico hoje uma versão boa e com as informações certas, e melhoro depois se precisar.",
      "Publico do jeito que está, mesmo com uma informação errada.",
      "Peço mais prazo ao gestor para caprichar.",
    ],
  },
  {
    id: "q6",
    mandamento: 5,
    situation: "Sua meta da semana é falar com 60 interessados. Na sexta às 16h você falou com 40. O que você faz?",
    options: [
      "Cumpri meu horário; continuo na segunda.",
      "Me organizo para fazer o máximo até o fim do dia e conto ao gestor o que faltou e por quê.",
      "Faço mais algumas ligações, se der tempo.",
      "Aviso o gestor que não vai dar e combino um novo prazo.",
    ],
  },
  {
    id: "q7",
    mandamento: 6,
    situation: "Surgiu uma ferramenta nova que pode facilitar o seu trabalho, mas ninguém da equipe sabe usar. O que você faz?",
    options: [
      "Espero a empresa oferecer um treinamento.",
      "Prefiro continuar com o que já conheço.",
      "Estudo por conta própria, testo em algo pequeno e mostro o resultado para a equipe.",
      "Vejo um vídeo sobre ela quando tiver tempo.",
    ],
  },
  {
    id: "q8",
    mandamento: 7,
    situation: "No fim do dia, você vê uma sala vazia com o ar-condicionado e as luzes ligados. Não é a sua sala. O que você faz?",
    options: [
      "Desligo tudo e, se isso acontece sempre, aviso o responsável.",
      "Não é a minha sala, então não mexo.",
      "Aviso alguém do setor no dia seguinte.",
      "Desligo as luzes, mas deixo o ar ligado.",
    ],
  },
  {
    id: "q9",
    mandamento: 8,
    situation: "Você percebe que passou para um aluno o valor errado da mensalidade. O que você faz?",
    options: [
      "Espero para ver se ele percebe.",
      "Corrijo com o aluno na hora, aviso meu gestor e explico como vou evitar que se repita.",
      "Corrijo com o aluno sem contar para ninguém.",
      "Explico ao gestor que a informação que me passaram estava confusa.",
    ],
  },
  {
    id: "q10",
    mandamento: 9,
    situation: "Um colega combina com você, no corredor, uma mudança importante no atendimento. O que você faz?",
    options: [
      "Confirmo por escrito (no grupo ou no sistema) o que foi combinado e sigo o processo.",
      "Faço como ele disse, já que foi combinado.",
      "Faço do meu jeito, já que não ficou registrado.",
      "Peço para ele registrar quando puder e já começo a fazer.",
    ],
  },
];

export interface CultureQuizResult {
  version: number;
  /** id da pergunta -> índice da alternativa escolhida */
  answers: Record<string, number>;
  /** Nota geral de 0 a 100 */
  score: number;
  /** Nota de 0 a 3 por mandamento (índice em MANDAMENTOS) */
  by_mandamento: Record<string, number>;
  submitted_at: string;
}

/** Faixa de leitura da nota. */
export function cultureBand(score: number) {
  if (score >= 80) return { label: "Muito alinhado à cultura", tone: "bg-emerald-100 text-emerald-800" };
  if (score >= 60) return { label: "Bom alinhamento", tone: "bg-sky-100 text-sky-800" };
  return { label: "Pontos de atenção", tone: "bg-amber-100 text-amber-800" };
}
