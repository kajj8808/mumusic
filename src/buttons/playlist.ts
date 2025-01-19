import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  type CacheType,
} from "discord.js";
import { getPlayList } from "../commands/play";

export const playlistButton = new ButtonBuilder()
  .setCustomId("playlist")
  .setLabel("📜")
  .setStyle(ButtonStyle.Secondary);

export async function playlist(interaction: ButtonInteraction<CacheType>) {
  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  if (interaction.guild && voiceChannel) {
    const guild = interaction.guild.id;
    const playlist = getPlayList(guild, voiceChannel.id);
    if (!playlist) {
      return await interaction.editReply("Playlist is empty..");
    } else {
      return await interaction.editReply(playlist.join("\n-"));
    }
  }
}
