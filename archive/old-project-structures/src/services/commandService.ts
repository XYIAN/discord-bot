import { Message } from 'discord.js';
import { GeneralCommands } from '../commands/general';
import { XyianCommands } from '../commands/xyian';
// import { logCommandUsage } from '../utils/logger';

export class CommandService {
  public async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;

    // Check for command prefix
    if (!message.content.startsWith('!')) return;

    // Parse command and arguments
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    try {
      // Handle XYIAN commands
      if (commandName === 'xyian') {
        await XyianCommands.handleCommand(message, args);
        return;
      }

      // Handle general commands
      await GeneralCommands.handleCommand(message, commandName, args);
    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      await message.reply('There was an error executing this command. Please try again.');
    }
  }
}
