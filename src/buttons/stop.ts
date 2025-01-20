import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  type CacheType,
} from "discord.js";
import { stopSong } from "../commands/play";

export const stopButton = new ButtonBuilder()
  .setCustomId("stop")
  .setLabel("🔥")
  .setStyle(ButtonStyle.Secondary);

export function stop(interaction: ButtonInteraction<CacheType>) {
  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  if (interaction.guild && voiceChannel) {
    const guild = interaction.guild.id;
    stopSong(guild, voiceChannel.id);
    interaction.reply("🔥 bye bye.. 🔥");
  }
}
