import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { getStats } from '../services/statsService.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Muestra tus estadisticas de estudio AWS');

function progressBar(current: number, total: number, length = 20): string {
  const filled = Math.round((current / total) * length);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${total}`;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const stats = getStats();

  const failedList = stats.mostFailed.length > 0
    ? stats.mostFailed
        .map((f, i) => `${i + 1}. Pregunta #${f.question_number} — ${f.correct}/${f.attempts} correctas`)
        .join('\n')
    : 'Sin datos aun';

  const embed = new EmbedBuilder()
    .setColor(0xFF9900)
    .setTitle('Estadisticas de Estudio — AWS CloudOps')
    .addFields(
      {
        name: 'Progreso',
        value: progressBar(stats.totalAnswered, stats.totalQuestions),
        inline: false,
      },
      {
        name: 'Tasa de acierto',
        value: `${stats.successRate.toFixed(1)}% (${stats.correctCount} correctas / ${stats.correctCount + stats.incorrectCount} total)`,
        inline: false,
      },
      {
        name: 'Racha actual',
        value: `${stats.currentStreak} respuestas correctas`,
        inline: true,
      },
      {
        name: 'Mejor racha',
        value: `${stats.bestStreak} respuestas correctas`,
        inline: true,
      },
      {
        name: 'Preguntas mas dificiles',
        value: failedList,
        inline: false,
      },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
