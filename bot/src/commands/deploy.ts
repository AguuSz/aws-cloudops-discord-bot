import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { data as challengeData } from './challenge.js';
import { data as setupData } from './setup.js';
import { data as statsData } from './stats.js';

const commands = [
  challengeData.toJSON(),
  setupData.toJSON(),
  statsData.toJSON(),
];

const rest = new REST().setToken(config.discordToken);

async function deploy() {
  try {
    console.log(`Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

deploy();
