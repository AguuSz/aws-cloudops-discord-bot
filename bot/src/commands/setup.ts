import {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Client,
} from 'discord.js';
import { setConfig, getAllConfig, restartScheduler } from '../services/schedulerService.js';
import { cronToTime, timeToCron, DEFAULT_TIMEZONE } from '../utils/timeUtils.js';

let clientRef: Client | null = null;

export function setClient(client: Client): void {
  clientRef = client;
}

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configurar el bot de estudio AWS')
  .addSubcommand(sub =>
    sub.setName('channel')
      .setDescription('Configura el canal para desafios diarios')
      .addChannelOption(opt =>
        opt.setName('canal')
          .setDescription('Canal de texto')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText),
      ),
  )
  .addSubcommand(sub =>
    sub.setName('time')
      .setDescription('Configura la hora del desafio diario')
      .addStringOption(opt =>
        opt.setName('hora')
          .setDescription('Hora en formato HH:mm (ej: 09:00)')
          .setRequired(true),
      ),
  )
  .addSubcommand(sub =>
    sub.setName('enable')
      .setDescription('Activa el desafio diario'),
  )
  .addSubcommand(sub =>
    sub.setName('disable')
      .setDescription('Desactiva el desafio diario'),
  )
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('Muestra la configuracion actual'),
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case 'channel': {
      const channel = interaction.options.getChannel('canal', true);
      setConfig('channel_id', channel.id);
      if (clientRef) restartScheduler(clientRef);
      await interaction.reply({ content: `Canal configurado: <#${channel.id}>`, ephemeral: true });
      break;
    }

    case 'time': {
      const hora = interaction.options.getString('hora', true);
      const match = hora.match(/^(\d{1,2}):(\d{2})$/);
      if (!match || parseInt(match[1]) > 23 || parseInt(match[2]) > 59) {
        await interaction.reply({ content: 'Formato invalido. Usa HH:mm (ej: 09:00)', ephemeral: true });
        return;
      }
      const cronExpr = timeToCron(hora);
      setConfig('cron_expression', cronExpr);
      const tz = getAllConfig().timezone ?? DEFAULT_TIMEZONE;
      if (clientRef) restartScheduler(clientRef);
      await interaction.reply({ content: `Hora configurada: ${hora} (${tz})`, ephemeral: true });
      break;
    }

    case 'enable': {
      setConfig('enabled', '1');
      if (clientRef) restartScheduler(clientRef);
      await interaction.reply({ content: 'Desafio diario activado.', ephemeral: true });
      break;
    }

    case 'disable': {
      setConfig('enabled', '0');
      if (clientRef) restartScheduler(clientRef);
      await interaction.reply({ content: 'Desafio diario desactivado.', ephemeral: true });
      break;
    }

    case 'status': {
      const cfg = getAllConfig();
      const channelId = cfg.channel_id;
      const cronExpr = cfg.cron_expression ?? '0 9 * * *';
      const tz = cfg.timezone ?? DEFAULT_TIMEZONE;
      const enabled = cfg.enabled !== '0';

      const embed = new EmbedBuilder()
        .setColor(0xFF9900)
        .setTitle('Configuracion del Bot')
        .addFields(
          { name: 'Canal', value: channelId ? `<#${channelId}>` : 'No configurado', inline: true },
          { name: 'Hora', value: cronToTime(cronExpr), inline: true },
          { name: 'Timezone', value: tz, inline: true },
          { name: 'Estado', value: enabled ? 'Activo' : 'Inactivo', inline: true },
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
    }
  }
}
