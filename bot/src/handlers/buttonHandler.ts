import type { ButtonInteraction } from 'discord.js';
import { getDb } from '../db/connection.js';
import { buildResultEmbed, buildQuestionEmbed } from '../ui/embedBuilder.js';
import { buildOptionButtons } from '../ui/componentBuilder.js';
import { saveAnswer } from '../services/questionService.js';
import type { QuestionRow, QuestionOption } from '../models/types.js';

// In-memory state: messageId -> Set<selectedOptionIndex>
const activeSelections = new Map<string, Set<number>>();

function getQuestion(questionId: number) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as QuestionRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    questionNumber: row.question_number,
    text: row.text,
    options: JSON.parse(row.options) as QuestionOption[],
    correctIndices: JSON.parse(row.correct_indices) as number[],
    requiredAnswers: row.required_answers,
    imageUrl: row.image_url,
  };
}

export async function handleOptionButton(interaction: ButtonInteraction): Promise<void> {
  const parts = interaction.customId.split('_');
  const questionId = parseInt(parts[1]);
  const optionIndex = parseInt(parts[2]);
  const messageId = interaction.message.id;

  const question = getQuestion(questionId);
  if (!question) {
    await interaction.reply({ content: 'Pregunta no encontrada.', ephemeral: true });
    return;
  }

  // Get or create selection set
  if (!activeSelections.has(messageId)) {
    activeSelections.set(messageId, new Set());
  }
  const selected = activeSelections.get(messageId)!;

  // Toggle logic
  if (question.requiredAnswers === 1) {
    // Single answer: clear and set
    selected.clear();
    selected.add(optionIndex);
  } else {
    // Multi answer: toggle
    if (selected.has(optionIndex)) {
      selected.delete(optionIndex);
    } else {
      selected.add(optionIndex);
    }
  }

  // Update message with new button states
  const embed = buildQuestionEmbed(question);
  const components = buildOptionButtons(question, selected);

  await interaction.update({ embeds: [embed], components });
}

export async function handleSubmitButton(interaction: ButtonInteraction): Promise<void> {
  const parts = interaction.customId.split('_');
  const questionId = parseInt(parts[1]);
  const messageId = interaction.message.id;

  const question = getQuestion(questionId);
  if (!question) {
    await interaction.reply({ content: 'Pregunta expirada. Usa /challenge para una nueva.', ephemeral: true });
    return;
  }

  const selected = activeSelections.get(messageId);
  if (!selected || selected.size === 0) {
    await interaction.reply({ content: 'Selecciona al menos una opcion primero.', ephemeral: true });
    return;
  }

  // Validate count for multi-answer
  if (question.requiredAnswers > 1 && selected.size !== question.requiredAnswers) {
    await interaction.reply({
      content: `Necesitas seleccionar ${question.requiredAnswers} respuestas. Seleccionaste ${selected.size}.`,
      ephemeral: true,
    });
    return;
  }

  // Evaluate
  const selectedArray = [...selected].sort();
  const correctArray = [...question.correctIndices].sort();
  const isCorrect = selectedArray.length === correctArray.length &&
    selectedArray.every((v, i) => v === correctArray[i]);

  // Save to DB
  saveAnswer(question.id, selectedArray, isCorrect);

  // Build result embed with disabled buttons
  const resultEmbed = buildResultEmbed(question, selectedArray, isCorrect);
  const disabledComponents = buildOptionButtons(question, selected, true);

  // Clean up state
  activeSelections.delete(messageId);

  await interaction.update({ embeds: [resultEmbed], components: disabledComponents });
}
