import { config } from 'dotenv';
import { BotConfig } from '../types';

// Load environment variables
config();

// Validate required environment variables
function validateConfig(): void {
  const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'XYIAN_GUILD_WEBHOOK'];
  
  for (const field of required) {
    if (!process.env[field]) {
      throw new Error(`Missing required environment variable: ${field}`);
    }
  }
}

// Export configuration
export const botConfig: BotConfig = {
  token: process.env['DISCORD_TOKEN']!,
  clientId: process.env['CLIENT_ID']!,
  guildId: process.env['GUILD_ID']!,
  webhooks: {
    generalChat: process.env['GENERAL_CHAT_WEBHOOK'] || '',
    xyianGuild: process.env['XYIAN_GUILD_WEBHOOK']!
  },
  community: {
    guildRoleName: process.env['GUILD_ROLE_NAME'] || 'XYIAN OFFICIAL',
    communityName: process.env['COMMUNITY_NAME'] || 'Arch 2 Addicts',
    gameName: process.env['GAME_NAME'] || 'Archero 2'
  }
};

// Validate configuration on import
validateConfig();
