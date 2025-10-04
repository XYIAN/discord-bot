// Discord Bot Types
export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  webhooks: {
    generalChat: string;
    xyianGuild: string;
  };
  community: {
    guildRoleName: string;
    communityName: string;
    gameName: string;
  };
}

// Archero 2 Game Types
export interface Weapon {
  name: string;
  tier: 'S-Tier' | 'A-Tier' | 'B-Tier' | 'C-Tier';
  type: string;
  special: string;
  recommended: boolean;
}

export interface Skill {
  name: string;
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  description: string;
  effect: string;
}

export interface Build {
  name: string;
  weapon: string;
  gear: string;
  skills: string;
  description: string;
}

export interface GuildData {
  id: string;
  name: string;
  level: number;
  memberCount: number;
  totalPower: number;
  guildCoins: number;
  lastUpdated: Date;
}

export interface PlayerData {
  id: string;
  discordId: string;
  archeroUsername?: string;
  guildId?: string;
  level?: number;
  powerLevel?: number;
  currentWeapon?: string;
  currentGearSet?: string;
  guildCoins?: number;
  lastActive?: Date;
  createdAt: Date;
}

// Webhook Types
export type EventType = 'info' | 'success' | 'warning' | 'error' | 'event';

export interface WebhookMessage {
  content?: string;
  username?: string;
  embeds?: any[];
}

// Command Types
export interface Command {
  name: string;
  description: string;
  execute: (message: any, args: string[]) => Promise<void>;
}

export interface XyianCommand extends Command {
  requiresXyianRole: boolean;
}

// Database Types
export interface DatabaseConfig {
  url: string;
  ssl?: boolean;
}

// Error Types
export class BotError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BotError';
  }
}

export class GuildError extends BotError {
  constructor(message: string, public guildId?: string) {
    super(message, 'GUILD_ERROR');
    this.name = 'GuildError';
  }
}

export class WebhookError extends BotError {
  constructor(message: string, public webhookUrl?: string) {
    super(message, 'WEBHOOK_ERROR');
    this.name = 'WebhookError';
  }
}
