import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  type CacheType,
} from "discord.js";
import { skipSong } from "../commands/play";

export const skipButton = new ButtonBuilder()
  .setCustomId("skip")
  .setLabel("⏭️")
  .setStyle(ButtonStyle.Secondary);

export function skip(interaction: ButtonInteraction<CacheType>) {
  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  if (interaction.guild && voiceChannel) {
    const guild = interaction.guild.id;
    skipSong(guild, voiceChannel.id);
  }
}
