import winston from 'winston';
import { BotError } from '../types';

// Create logger instance
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Error handling
export function handleError(error: unknown, context?: string): void {
  if (error instanceof BotError) {
    logger.error(`Bot Error${context ? ` in ${context}` : ''}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  } else if (error instanceof Error) {
    logger.error(`Unexpected Error${context ? ` in ${context}` : ''}:`, {
      message: error.message,
      stack: error.stack
    });
  } else {
    logger.error(`Unknown Error${context ? ` in ${context}` : ''}:`, error);
  }
}

// Guild-specific logging
export function logGuildActivity(activity: string, guildId?: string, userId?: string): void {
  logger.info('Guild Activity', {
    activity,
    guildId,
    userId,
    timestamp: new Date().toISOString()
  });
}

// Command usage logging
export function logCommandUsage(command: string, userId: string, guildId?: string): void {
  logger.info('Command Usage', {
    command,
    userId,
    guildId,
    timestamp: new Date().toISOString()
  });
}
