import { Message, EmbedBuilder } from 'discord.js';
import { logCommandUsage } from '../utils/logger';

// General Bot Commands
export class GeneralCommands {
  public static async handleCommand(message: Message, commandName: string, _args: string[]): Promise<void> {
    logCommandUsage(commandName, message.author.id, message.guild?.id);

    switch (commandName) {
      case 'ping':
        await this.ping(message);
        break;
      case 'help':
        await this.help(message);
        break;
      case 'info':
        await this.info(message);
        break;
      case 'xyian':
        // This should be handled by XyianCommands
        break;
      default:
        await this.unknownCommand(message, commandName);
    }
  }

  private static async ping(message: Message): Promise<void> {
    await message.reply('Pong!');
  }

  private static async help(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('Arch 2 Addicts Bot Commands')
      .setDescription('Available commands for the community')
      .setColor(0x0099ff)
      .addFields(
        { name: '!ping', value: 'Check if bot is online', inline: true },
        { name: '!help', value: 'Show this help message', inline: true },
        { name: '!info', value: 'Show server information', inline: true },
        { name: '!xyian', value: 'XYIAN OFFICIAL commands (guild members only)', inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async info(message: Message): Promise<void> {
    const guild = message.guild;
    if (!guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Arch 2 Addicts Server Info')
      .setDescription('Community information and statistics')
      .setColor(0x0099ff)
      .addFields(
        { name: 'Server Name', value: guild.name, inline: true },
        { name: 'Member Count', value: `${guild.memberCount}`, inline: true },
        { name: 'Created', value: guild.createdAt.toDateString(), inline: true },
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true }
      )
      .setThumbnail(guild.iconURL())
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async unknownCommand(message: Message, commandName: string): Promise<void> {
    await message.reply(`Unknown command: \`${commandName}\`. Use \`!help\` to see available commands.`);
  }
}
