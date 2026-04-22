import { getDb } from './connection.js';
import { initSchema } from './schema.js';
import { parseReadme } from '../parser/questionParser.js';
import { config } from '../config.js';

const db = getDb();
initSchema(db);

console.log(`Parsing questions from: ${config.questionsReadmePath}`);
const questions = parseReadme(config.questionsReadmePath, config.questionsImagesBaseUrl);
console.log(`Parsed ${questions.length} questions`);

// Clear existing questions and re-seed
db.exec('DELETE FROM questions');

const insert = db.prepare(`
  INSERT INTO questions (question_number, text, options, correct_indices, required_answers, image_url)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction(() => {
  for (const q of questions) {
    insert.run(
      q.questionNumber,
      q.text,
      JSON.stringify(q.options),
      JSON.stringify(q.correctIndices),
      q.requiredAnswers,
      q.imageUrl,
    );
  }
});

insertMany();

// Verification
const count = db.prepare('SELECT COUNT(*) as total FROM questions').get() as { total: number };
const multiAnswer = db.prepare('SELECT COUNT(*) as total FROM questions WHERE required_answers > 1').get() as { total: number };
const withImages = db.prepare('SELECT COUNT(*) as total FROM questions WHERE image_url IS NOT NULL').get() as { total: number };

console.log(`\nSeed complete:`);
console.log(`  Total questions: ${count.total}`);
console.log(`  Multi-answer questions: ${multiAnswer.total}`);
console.log(`  Questions with images: ${withImages.total}`);

db.close();
