import { getDb } from '../db/connection.js';
import { getTotalQuestions } from './questionService.js';

export interface Stats {
  totalAnswered: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  successRate: number;
  currentStreak: number;
  bestStreak: number;
  mostFailed: { question_number: number; attempts: number; correct: number }[];
}

export function getStats(): Stats {
  const db = getDb();
  const totalQuestions = getTotalQuestions();

  // Global stats
  const global = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(is_correct) as correct
    FROM user_answers
  `).get() as { total: number; correct: number };

  const totalAnswered = db.prepare(`
    SELECT COUNT(DISTINCT question_id) as total FROM user_answers
  `).get() as { total: number };

  // Streaks
  const answers = db.prepare(`
    SELECT is_correct FROM user_answers ORDER BY answered_at DESC
  `).all() as { is_correct: number }[];

  let currentStreak = 0;
  for (const a of answers) {
    if (a.is_correct === 1) currentStreak++;
    else break;
  }

  let bestStreak = 0;
  let streak = 0;
  for (const a of answers) {
    if (a.is_correct === 1) {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Most failed questions
  const mostFailed = db.prepare(`
    SELECT
      q.question_number,
      COUNT(*) as attempts,
      SUM(ua.is_correct) as correct
    FROM user_answers ua
    JOIN questions q ON ua.question_id = q.id
    GROUP BY ua.question_id
    HAVING attempts > 0
    ORDER BY (CAST(SUM(ua.is_correct) AS FLOAT) / COUNT(*)) ASC, attempts DESC
    LIMIT 5
  `).all() as { question_number: number; attempts: number; correct: number }[];

  return {
    totalAnswered: totalAnswered.total,
    totalQuestions,
    correctCount: global.correct ?? 0,
    incorrectCount: (global.total ?? 0) - (global.correct ?? 0),
    successRate: global.total > 0 ? ((global.correct ?? 0) / global.total) * 100 : 0,
    currentStreak,
    bestStreak,
    mostFailed,
  };
}
