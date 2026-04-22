import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  discordToken: process.env.DISCORD_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  guildId: process.env.GUILD_ID!,
  questionsReadmePath: path.resolve(__dirname, '..', process.env.QUESTIONS_README_PATH || '../questions-repo/README.md'),
  questionsImagesBaseUrl: process.env.QUESTIONS_IMAGES_BASE_URL || 'https://raw.githubusercontent.com/Ditectrev/AWS-Certified-CloudOps-Engineer-Associate-SOA-C03-Practice-Tests-Exams-Questions-Answers/main/images',
  dbPath: path.resolve(__dirname, '..', 'data', 'questions.db'),
};
