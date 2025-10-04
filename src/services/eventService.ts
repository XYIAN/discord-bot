import { Client, GuildMember, EmbedBuilder } from 'discord.js';
import { WebhookService } from './webhookService';
import { logGuildActivity } from '../utils/logger';

export class EventService {
  // private webhookService: WebhookService;

  constructor(_webhookService: WebhookService) {
    // this.webhookService = webhookService;
  }

  public setupEventHandlers(client: Client): void {
    // Member join event
    client.on('guildMemberAdd', async (member: GuildMember) => {
      await this.handleMemberJoin(member);
    });

    // Member leave event
    client.on('guildMemberRemove', async (member: GuildMember | any) => {
      await this.handleMemberLeave(member);
    });

    // Error handling
    client.on('error', (error: Error) => {
      console.error('Discord client error:', error);
    });
  }

  private async handleMemberJoin(member: GuildMember): Promise<void> {
    console.log(`${member.user.username} joined the server`);
    logGuildActivity('member_join', member.guild.id, member.user.id);

    // Send welcome message
    const welcomeChannel = member.guild.channels.cache.find(
      channel => channel.name === 'general-chat'
    );

    if (welcomeChannel && welcomeChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle('Welcome to Arch 2 Addicts!')
        .setDescription(`Welcome ${member} to our community!`)
        .setColor(0x00ff00)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
          { name: 'Server', value: 'Arch 2 Addicts', inline: true }
        )
        .setTimestamp();

      await welcomeChannel.send({ embeds: [embed] });
    }

    // Assign base member role
    const memberRole = member.guild.roles.cache.find(role => role.name === 'Member');
    if (memberRole) {
      try {
        await member.roles.add(memberRole);
        console.log(`Assigned Member role to ${member.user.username}`);
      } catch (error) {
        console.error(`Failed to assign Member role to ${member.user.username}:`, error);
      }
    }
  }

  private async handleMemberLeave(member: GuildMember): Promise<void> {
    console.log(`${member.user.username} left the server`);
    logGuildActivity('member_leave', member.guild.id, member.user.id);
  }
}
