import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { getDb } from './db/connection.js';
import { initSchema } from './db/schema.js';
import { handleInteraction, registerCommand } from './handlers/interactionHandler.js';
import { execute as challengeExecute } from './commands/challenge.js';
import { execute as setupExecute, setClient } from './commands/setup.js';
import { execute as statsExecute } from './commands/stats.js';
import { startScheduler } from './services/schedulerService.js';
import { parseReadme } from './parser/questionParser.js';

// Init DB
const db = getDb();
initSchema(db);

// Auto-seed if DB is empty
const count = db.prepare('SELECT COUNT(*) as total FROM questions').get() as { total: number };
if (count.total === 0) {
  console.log('DB empty, seeding questions...');
  const questions = parseReadme(config.questionsReadmePath, config.questionsImagesBaseUrl);
  const insert = db.prepare(`
    INSERT INTO questions (question_number, text, options, correct_indices, required_answers, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  db.transaction(() => {
    for (const q of questions) {
      insert.run(q.questionNumber, q.text, JSON.stringify(q.options), JSON.stringify(q.correctIndices), q.requiredAnswers, q.imageUrl);
    }
  })();
  console.log(`Seeded ${questions.length} questions`);
} else {
  console.log(`DB has ${count.total} questions`);
}

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register commands
registerCommand('challenge', challengeExecute);
registerCommand('setup', setupExecute);
registerCommand('stats', statsExecute);

// Events
client.once('ready', (c) => {
  console.log(`Bot online: ${c.user.tag}`);
  setClient(client);
  startScheduler(client);
});

client.on('interactionCreate', handleInteraction);

// Login
client.login(config.discordToken);
