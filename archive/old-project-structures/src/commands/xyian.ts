import { Message, EmbedBuilder } from 'discord.js';
import { Weapon, Skill, Build } from '../types';
import { logCommandUsage } from '../utils/logger';

// XYIAN Guild Commands
export class XyianCommands {
  private static readonly weapons: Record<string, Weapon> = {
    'dragon knight crossbow': {
      name: 'Dragon Knight Crossbow',
      tier: 'S-Tier',
      type: 'Crossbow',
      special: 'Explosive arrows with area damage',
      recommended: true
    },
    'griffin claw': {
      name: 'Griffin Claw',
      tier: 'S-Tier',
      type: 'Claw',
      special: 'Multi-hit attacks',
      recommended: true
    },
    'beam staff': {
      name: 'Beam Staff',
      tier: 'A-Tier',
      type: 'Staff',
      special: 'Continuous beam damage',
      recommended: true
    }
  };

  private static readonly skills: Record<string, Skill> = {
    'tracking eye': {
      name: 'Tracking Eye',
      rarity: 'Legendary',
      description: 'Projectiles track enemies automatically',
      effect: 'Makes all projectiles home in on targets'
    },
    'revive': {
      name: 'Revive',
      rarity: 'Legendary',
      description: 'Gain an extra life when defeated',
      effect: 'Revive once per run with full health'
    },
    'giant strength': {
      name: 'Giant\'s Strength',
      rarity: 'Epic',
      description: 'Increases Attack Power by 20%',
      effect: 'Multiplicative damage boost'
    }
  };

  private static readonly builds: Record<string, Build> = {
    'pvp': {
      name: 'PvP Build',
      weapon: 'Dragon Knight Crossbow',
      gear: 'Griffin Set',
      skills: 'Tracking Eye, Front Arrow, Giant\'s Strength',
      description: 'Optimized for player vs player combat'
    },
    'pve': {
      name: 'PvE Build',
      weapon: 'Griffin Claw',
      gear: 'Oracle Set',
      skills: 'Revive, Tracking Eye, Swift Arrow',
      description: 'Optimized for player vs environment'
    },
    'farming': {
      name: 'Farming Build',
      weapon: 'Beam Staff',
      gear: 'Echo Set',
      skills: 'Tracking Eye, Multi-shot, Ricochet',
      description: 'Optimized for efficient farming'
    }
  };

  public static async handleCommand(message: Message, args: string[]): Promise<void> {
    const member = message.member;
    const isXyianMember = member?.roles.cache.some(role => role.name === 'XYIAN OFFICIAL');
    
    if (!isXyianMember) {
      await message.reply('This command is only available to XYIAN OFFICIAL members.');
      return;
    }

    const subcommand = args[0];
    logCommandUsage(`xyian ${subcommand}`, message.author.id, message.guild?.id);

    switch (subcommand) {
      case 'info':
        await this.showGuildInfo(message);
        break;
      case 'members':
        await this.showMembers(message);
        break;
      case 'stats':
        await this.showStats(message);
        break;
      case 'events':
        await this.showEvents(message);
        break;
      case 'help':
        await this.showHelp(message);
        break;
      case 'weapon':
        await this.showWeaponInfo(message, args.slice(1));
        break;
      case 'skill':
        await this.showSkillInfo(message, args.slice(1));
        break;
      case 'build':
        await this.showBuildGuide(message, args.slice(1));
        break;
      default:
        await this.showHelp(message);
    }
  }

  private static async showGuildInfo(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🏰 XYIAN OFFICIAL Guild Information')
      .setDescription('Welcome to the XYIAN guild - the elite force of Arch 2 Addicts!')
      .setColor(0xffd700)
      .addFields(
        { name: 'Guild Level', value: 'Level 5', inline: true },
        { name: 'Members', value: '25/50', inline: true },
        { name: 'Guild Coins', value: '12,500', inline: true },
        { name: 'Best Weapon', value: 'Dragon Knight Crossbow', inline: true },
        { name: 'Recommended Set', value: 'Griffin Set (PvP)', inline: true },
        { name: 'Guild Benefits', value: '10% discount on items', inline: true }
      )
      .setThumbnail('https://via.placeholder.com/100x100/FFD700/000000?text=XYIAN')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showMembers(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('👥 XYIAN OFFICIAL Members')
      .setDescription('Elite guild members and their achievements')
      .setColor(0x0099ff)
      .addFields(
        { name: 'Guild Leader', value: 'Kyle (Power: 15,000)', inline: false },
        { name: 'Top Contributors', value: 'Member1, Member2, Member3', inline: false },
        { name: 'Recent Joiners', value: 'NewMember1, NewMember2', inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showStats(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('📊 XYIAN Guild Statistics')
      .setDescription('Current guild performance and metrics')
      .setColor(0x00ff00)
      .addFields(
        { name: 'Total Power', value: '375,000', inline: true },
        { name: 'Average Power', value: '15,000', inline: true },
        { name: 'Weekly Activity', value: '95%', inline: true },
        { name: 'Bosses Defeated', value: '1,250', inline: true },
        { name: 'Items Farmed', value: '5,000', inline: true },
        { name: 'Guild Rank', value: '#15', inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showEvents(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🎯 XYIAN Guild Events')
      .setDescription('Upcoming and active guild events')
      .setColor(0xff6b6b)
      .addFields(
        { name: 'Active Events', value: 'Weekly Farming Challenge\nBoss Slayer Challenge', inline: false },
        { name: 'Upcoming', value: 'Guild Tournament (Next Week)\nEquipment Exchange Event', inline: false },
        { name: 'Rewards', value: 'Guild Coins + Exclusive Titles', inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showHelp(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🏰 XYIAN Guild Commands')
      .setDescription('Available commands for XYIAN OFFICIAL members')
      .setColor(0xffd700)
      .addFields(
        { name: '!xyian info', value: 'Guild information and status', inline: true },
        { name: '!xyian members', value: 'List guild members', inline: true },
        { name: '!xyian stats', value: 'Guild statistics', inline: true },
        { name: '!xyian events', value: 'Guild events and challenges', inline: true },
        { name: '!xyian weapon [name]', value: 'Weapon information', inline: true },
        { name: '!xyian skill [name]', value: 'Skill information', inline: true },
        { name: '!xyian build [type]', value: 'Build recommendations', inline: true },
        { name: '!xyian help', value: 'Show this help message', inline: true }
      )
      .setFooter({ text: 'XYIAN OFFICIAL - Arch 2 Addicts' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showWeaponInfo(message: Message, args: string[]): Promise<void> {
    const weaponName = args.join(' ').toLowerCase();
    const weapon = this.weapons[weaponName] || {
      name: 'Weapon Not Found',
      tier: 'Unknown' as const,
      type: 'Unknown',
      special: 'Use: !xyian weapon [dragon knight crossbow, griffin claw, beam staff]',
      recommended: false
    };

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${weapon.name}`)
      .setDescription(weapon.special)
      .setColor(weapon.recommended ? 0x00ff00 : 0xffaa00)
      .addFields(
        { name: 'Tier', value: weapon.tier, inline: true },
        { name: 'Type', value: weapon.type, inline: true },
        { name: 'Recommended', value: weapon.recommended ? '✅ Yes' : '❌ No', inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showSkillInfo(message: Message, args: string[]): Promise<void> {
    const skillName = args.join(' ').toLowerCase();
    const skill = this.skills[skillName] || {
      name: 'Skill Not Found',
      rarity: 'Unknown' as const,
      description: 'Use: !xyian skill [tracking eye, revive, giant strength]',
      effect: 'Check available skills'
    };

    const embed = new EmbedBuilder()
      .setTitle(`🎯 ${skill.name}`)
      .setDescription(skill.description)
      .setColor(skill.rarity === 'Legendary' ? 0xff6b6b : 0x0099ff)
      .addFields(
        { name: 'Rarity', value: skill.rarity, inline: true },
        { name: 'Effect', value: skill.effect, inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private static async showBuildGuide(message: Message, args: string[]): Promise<void> {
    const buildType = args.join(' ').toLowerCase();
    const build = this.builds[buildType] || {
      name: 'Build Guide',
      weapon: 'See available builds',
      gear: 'Use: !xyian build [pvp, pve, farming]',
      skills: 'Check build types above',
      description: 'Choose your playstyle'
    };

    const embed = new EmbedBuilder()
      .setTitle(`🏗️ ${build.name}`)
      .setDescription(build.description)
      .setColor(0x00ff00)
      .addFields(
        { name: 'Weapon', value: build.weapon, inline: true },
        { name: 'Gear Set', value: build.gear, inline: true },
        { name: 'Skills', value: build.skills, inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}
