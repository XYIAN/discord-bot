import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { botConfig } from './utils/config';
import { logger, handleError } from './utils/logger';
import { WebhookService } from './services/webhookService';
import { EventService } from './services/eventService';
import { CommandService } from './services/commandService';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Initialize services
const webhookService = new WebhookService(
  botConfig.webhooks.generalChat,
  botConfig.webhooks.xyianGuild
);

const eventService = new EventService(webhookService);
const commandService = new CommandService();

// Bot ready event
client.once('ready', async () => {
  logger.info(`Bot is online as ${client.user?.tag}!`);
  logger.info(`Serving ${client.guilds.cache.size} guilds`);

  // Set bot status
  client.user?.setActivity('Arch 2 Addicts Community', { type: ActivityType.Watching });

  // Send startup message to XYIAN guild
  try {
    await webhookService.sendGuildAnnouncement(
      'Bot Online',
      'XYIAN Guild bot is now online and ready to serve! Use `!xyian help` for available commands.',
      'success'
    );
    logger.info('Startup message sent to XYIAN guild');
  } catch (error) {
    handleError(error, 'startup message');
  }
});

// Message handling
client.on('messageCreate', async (message) => {
  try {
    await commandService.handleMessage(message);
  } catch (error) {
    handleError(error, 'message handling');
  }
});

// Setup event handlers
eventService.setupEventHandlers(client);

// Global error handling
process.on('unhandledRejection', (error) => {
  handleError(error, 'unhandled rejection');
});

process.on('uncaughtException', (error) => {
  handleError(error, 'uncaught exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Start bot
client.login(botConfig.token).catch((error) => {
  handleError(error, 'bot login');
  process.exit(1);
});

// Export for testing
export { client, webhookService };
