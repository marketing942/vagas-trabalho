import "server-only";
import { CULTURE_QUIZ, QUIZ_VERSION, type CultureQuizResult } from "./culture-quiz";

/** Pontos de cada alternativa (0 a 3), na mesma ordem das opções. Só no servidor. */
const POINTS: Record<string, number[]> = {
  q1: [1, 3, 0, 2],
  q2: [0, 1, 3, 2],
  q3: [0, 1, 3, 1],
  q4: [3, 1, 0, 2],
  q5: [1, 3, 0, 1],
  q6: [0, 3, 1, 2],
  q7: [1, 0, 3, 2],
  q8: [3, 0, 2, 1],
  q9: [0, 3, 1, 0],
  q10: [3, 1, 0, 2],
};

/** Pontos de cada alternativa, para mostrar ao RH (nunca ao candidato). */
export const quizPoints = (id: string) => POINTS[id] ?? [];

/** Confere as respostas e calcula a nota. Retorna null se faltar resposta ou vier algo inválido. */
export function scoreQuiz(raw: unknown): CultureQuizResult | null {
  if (!raw || typeof raw !== "object") return null;
  const answers: Record<string, number> = {};
  const by: Record<string, number> = {};
  let total = 0;
  for (const q of CULTURE_QUIZ) {
    const v = (raw as Record<string, unknown>)[q.id];
    const i = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(i) || i < 0 || i >= q.options.length) return null;
    answers[q.id] = i;
    const pts = POINTS[q.id][i] ?? 0;
    by[String(q.mandamento)] = pts;
    total += pts;
  }
  return { version: QUIZ_VERSION, answers, score: Math.round((total / (CULTURE_QUIZ.length * 3)) * 100), by_mandamento: by, submitted_at: new Date().toISOString() };
}
