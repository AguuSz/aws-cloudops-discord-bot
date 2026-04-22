import type { Interaction } from 'discord.js';
import { handleOptionButton, handleSubmitButton } from './buttonHandler.js';

// Command handlers registered dynamically
const commands = new Map<string, (interaction: any) => Promise<void>>();

export function registerCommand(name: string, handler: (interaction: any) => Promise<void>): void {
  commands.set(name, handler);
}

export async function handleInteraction(interaction: Interaction): Promise<void> {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const handler = commands.get(interaction.commandName);
    if (handler) {
      try {
        await handler(interaction);
      } catch (error) {
        console.error(`Error in command ${interaction.commandName}:`, error);
        const reply = interaction.replied || interaction.deferred
          ? interaction.followUp.bind(interaction)
          : interaction.reply.bind(interaction);
        await reply({ content: 'Hubo un error ejecutando el comando.', ephemeral: true });
      }
    }
    return;
  }

  // Button interactions
  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith('option_')) {
        await handleOptionButton(interaction);
      } else if (interaction.customId.startsWith('submit_')) {
        await handleSubmitButton(interaction);
      }
    } catch (error) {
      console.error('Error handling button:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Pregunta expirada. Usa /challenge para una nueva.', ephemeral: true });
      }
    }
  }
}
