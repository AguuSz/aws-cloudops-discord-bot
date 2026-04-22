import { getDb } from '../db/connection.js';
import type { QuestionRow, QuestionOption } from '../models/types.js';

export interface Question {
  id: number;
  questionNumber: number;
  text: string;
  options: QuestionOption[];
  correctIndices: number[];
  requiredAnswers: number;
  imageUrl: string | null;
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    questionNumber: row.question_number,
    text: row.text,
    options: JSON.parse(row.options),
    correctIndices: JSON.parse(row.correct_indices),
    requiredAnswers: row.required_answers,
    imageUrl: row.image_url,
  };
}

export function getRandomQuestion(): Question | null {
  const db = getDb();

  // Priority 1: never answered
  let row = db.prepare(`
    SELECT q.* FROM questions q
    WHERE q.id NOT IN (SELECT DISTINCT question_id FROM user_answers)
    ORDER BY RANDOM() LIMIT 1
  `).get() as QuestionRow | undefined;

  // Priority 2: most failed
  if (!row) {
    row = db.prepare(`
      SELECT q.* FROM questions q
      JOIN (
        SELECT question_id, AVG(is_correct) as rate
        FROM user_answers
        GROUP BY question_id
        ORDER BY rate ASC
        LIMIT 20
      ) worst ON q.id = worst.question_id
      ORDER BY RANDOM() LIMIT 1
    `).get() as QuestionRow | undefined;
  }

  // Fallback: random
  if (!row) {
    row = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT 1').get() as QuestionRow | undefined;
  }

  return row ? rowToQuestion(row) : null;
}

export function getQuestionByNumber(num: number): Question | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM questions WHERE question_number = ?').get(num) as QuestionRow | undefined;
  return row ? rowToQuestion(row) : null;
}

export function getTotalQuestions(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as total FROM questions').get() as { total: number };
  return row.total;
}

export function saveAnswer(questionId: number, selectedIndices: number[], isCorrect: boolean): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO user_answers (question_id, selected_indices, is_correct)
    VALUES (?, ?, ?)
  `).run(questionId, JSON.stringify(selectedIndices), isCorrect ? 1 : 0);
}
