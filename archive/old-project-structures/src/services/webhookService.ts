import { WebhookClient, EmbedBuilder } from 'discord.js';
import { EventType } from '../types';
import { handleError } from '../utils/logger';

export class WebhookService {
  private generalWebhook: WebhookClient;
  private xyianGuildWebhook: WebhookClient;

  constructor(generalWebhookUrl: string, xyianGuildWebhookUrl: string) {
    this.generalWebhook = new WebhookClient({ url: generalWebhookUrl });
    this.xyianGuildWebhook = new WebhookClient({ url: xyianGuildWebhookUrl });
  }

  public async sendGeneralMessage(content: string, username: string = 'Arch 2 Bot'): Promise<void> {
    try {
      await this.generalWebhook.send({
        content,
        username
      });
    } catch (error) {
      handleError(error, 'sendGeneralMessage');
    }
  }

  public async sendGuildMessage(content: string, username: string = 'XYIAN Guild Bot'): Promise<void> {
    try {
      await this.xyianGuildWebhook.send({
        content,
        username
      });
    } catch (error) {
      handleError(error, 'sendGuildMessage');
    }
  }

  public async sendGuildAnnouncement(
    title: string, 
    description: string, 
    eventType: EventType = 'info'
  ): Promise<void> {
    const colors = {
      'info': 0x0099ff,
      'success': 0x00ff00,
      'warning': 0xffaa00,
      'error': 0xff0000,
      'event': 0xff6b6b
    };

    const embed = new EmbedBuilder()
      .setTitle(`🏰 XYIAN Guild: ${title}`)
      .setDescription(description)
      .setColor(colors[eventType])
      .setTimestamp()
      .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' });

    try {
      await this.xyianGuildWebhook.send({ embeds: [embed] });
    } catch (error) {
      handleError(error, 'sendGuildAnnouncement');
    }
  }

  public async sendGuildEvent(event: {
    name: string;
    type: string;
    duration: string;
    rewards: string;
  }): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🎯 Guild Event')
      .setDescription(`**${event.name}**`)
      .addFields(
        { name: 'Type', value: event.type, inline: true },
        { name: 'Duration', value: event.duration, inline: true },
        { name: 'Rewards', value: event.rewards, inline: true }
      )
      .setColor(0xff6b6b)
      .setTimestamp();

    try {
      await this.xyianGuildWebhook.send({ embeds: [embed] });
    } catch (error) {
      handleError(error, 'sendGuildEvent');
    }
  }
}
