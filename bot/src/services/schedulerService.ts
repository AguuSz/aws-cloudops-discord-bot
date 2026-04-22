import cron from 'node-cron';
import type { Client, TextChannel } from 'discord.js';
import { getDb } from '../db/connection.js';
import { getRandomQuestion } from './questionService.js';
import { buildQuestionEmbed } from '../ui/embedBuilder.js';
import { buildOptionButtons } from '../ui/componentBuilder.js';
import type { BotConfigRow } from '../models/types.js';

let activeJob: cron.ScheduledTask | null = null;

function getConfig(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM bot_config WHERE key = ?').get(key) as BotConfigRow | undefined;
  return row?.value ?? null;
}

export function setConfig(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO bot_config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function getAllConfig(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM bot_config').all() as BotConfigRow[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

async function sendDailyChallenge(client: Client): Promise<void> {
  const channelId = getConfig('channel_id');
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId) as TextChannel;
    if (!channel) return;

    const question = getRandomQuestion();
    if (!question) return;

    const embed = buildQuestionEmbed(question);
    const components = buildOptionButtons(question);

    await channel.send({ embeds: [embed], components });
    console.log(`Daily challenge sent: Question #${question.questionNumber}`);
  } catch (error) {
    console.error('Error sending daily challenge:', error);
  }
}

export function startScheduler(client: Client): void {
  stopScheduler();

  const enabled = getConfig('enabled');
  if (enabled === '0') return;

  const cronExpression = getConfig('cron_expression') ?? '0 9 * * *';
  const timezone = getConfig('timezone') ?? 'America/Argentina/Cordoba';

  if (!cron.validate(cronExpression)) {
    console.error(`Invalid cron expression: ${cronExpression}`);
    return;
  }

  activeJob = cron.schedule(cronExpression, () => sendDailyChallenge(client), {
    timezone,
  });

  console.log(`Scheduler started: "${cronExpression}" (${timezone})`);
}

export function stopScheduler(): void {
  if (activeJob) {
    activeJob.stop();
    activeJob = null;
  }
}

export function restartScheduler(client: Client): void {
  startScheduler(client);
}
