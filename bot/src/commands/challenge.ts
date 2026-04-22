import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { getRandomQuestion, getQuestionByNumber } from '../services/questionService.js';
import { buildQuestionEmbed } from '../ui/embedBuilder.js';
import { buildOptionButtons } from '../ui/componentBuilder.js';

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('Recibe una pregunta de AWS CloudOps para practicar')
  .addIntegerOption(opt =>
    opt.setName('numero')
      .setDescription('Numero de pregunta especifica (1-397)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(397),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const numero = interaction.options.getInteger('numero');

  const question = numero
    ? getQuestionByNumber(numero)
    : getRandomQuestion();

  if (!question) {
    await interaction.reply({ content: 'No se encontro la pregunta.', ephemeral: true });
    return;
  }

  const embed = buildQuestionEmbed(question);
  const components = buildOptionButtons(question);

  await interaction.reply({ embeds: [embed], components });
}
