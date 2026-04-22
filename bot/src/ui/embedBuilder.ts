import { EmbedBuilder } from 'discord.js';
import type { Question } from '../services/questionService.js';
import { getEmoji } from '../utils/emojiMap.js';
import { getTotalQuestions } from '../services/questionService.js';

const AWS_ORANGE = 0xFF9900;
const CORRECT_GREEN = 0x00C853;
const INCORRECT_RED = 0xFF1744;

export function buildQuestionEmbed(question: Question): EmbedBuilder {
  const total = getTotalQuestions();
  const optionsList = question.options
    .map((opt, i) => {
      let line = `${getEmoji(i)} ${opt.text}`;
      if (opt.imageUrl) {
        line += `\n   [Ver imagen](${opt.imageUrl})`;
      }
      return line;
    })
    .join('\n\n');

  const footerText = question.requiredAnswers > 1
    ? `Selecciona ${question.requiredAnswers} respuestas y presiona Verificar`
    : 'Selecciona una respuesta y presiona Verificar';

  const embed = new EmbedBuilder()
    .setColor(AWS_ORANGE)
    .setTitle(`Pregunta #${question.questionNumber} de ${total}`)
    .setDescription(`${question.text}\n\n${optionsList}`)
    .setFooter({ text: footerText })
    .setTimestamp();

  if (question.imageUrl) {
    embed.setImage(question.imageUrl);
  }

  return embed;
}

export function buildResultEmbed(
  question: Question,
  selectedIndices: number[],
  isCorrect: boolean,
): EmbedBuilder {
  const total = getTotalQuestions();
  const optionsList = question.options
    .map((opt, i) => {
      const isSelected = selectedIndices.includes(i);
      const isAnswer = question.correctIndices.includes(i);

      let prefix = getEmoji(i);
      if (isAnswer && isSelected) prefix = `✅ ${prefix}`;
      else if (isAnswer && !isSelected) prefix = `🟢 ${prefix}`;
      else if (!isAnswer && isSelected) prefix = `❌ ${prefix}`;

      let line = `${prefix} ${opt.text}`;
      if (opt.imageUrl) {
        line += `\n   [Ver imagen](${opt.imageUrl})`;
      }
      return line;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setColor(isCorrect ? CORRECT_GREEN : INCORRECT_RED)
    .setTitle(`Pregunta #${question.questionNumber} de ${total} — ${isCorrect ? '¡Correcto!' : 'Incorrecto'}`)
    .setDescription(`${question.text}\n\n${optionsList}`)
    .setTimestamp();
}
