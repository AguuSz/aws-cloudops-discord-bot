import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Question } from '../services/questionService.js';
import { getLabel } from '../utils/emojiMap.js';
import { OPTION_EMOJIS } from '../utils/emojiMap.js';

export function buildOptionButtons(
  question: Question,
  selectedIndices: Set<number> = new Set(),
  disabled = false,
): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();
  let buttonsInRow = 0;

  for (const opt of question.options) {
    if (buttonsInRow === 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
      buttonsInRow = 0;
    }

    const isSelected = selectedIndices.has(opt.index);
    const button = new ButtonBuilder()
      .setCustomId(`option_${question.id}_${opt.index}`)
      .setLabel(getLabel(opt.index))
      .setEmoji(OPTION_EMOJIS[opt.index])
      .setStyle(isSelected ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(disabled);

    currentRow.addComponents(button);
    buttonsInRow++;
  }

  if (buttonsInRow > 0) {
    rows.push(currentRow);
  }

  // Submit button in its own row
  const submitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`submit_${question.id}`)
      .setLabel('Verificar')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
  );
  rows.push(submitRow);

  return rows;
}
