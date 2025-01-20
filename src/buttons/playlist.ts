import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  type CacheType,
} from "discord.js";
import { getPlayList } from "../commands/play";
import { formatSecondsToMinutes } from "../lib/utils";

export const playlistButton = new ButtonBuilder()
  .setCustomId("playlist")
  .setLabel("📜")
  .setStyle(ButtonStyle.Secondary);

export async function playlist(interaction: ButtonInteraction<CacheType>) {
  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  if (interaction.guild && voiceChannel) {
    const guild = interaction.guild.id;
    const playlist = getPlayList(guild, voiceChannel.id);
    if (!playlist || playlist.length === 0) {
      return await interaction.reply("🔥 playlist is empty.. 🔥");
    } else {
      return await interaction.reply(
        `-# mumusic
        ${playlist
          .map(
            (song, index) =>
              `${index + 1}. ${song.videoTitle} - [${formatSecondsToMinutes(
                song.duration
              )}]`
          )
          .join("\n")}`
      );
    }
  }
}
