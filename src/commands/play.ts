import { useMainPlayer } from "discord-player";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  GuildMember,
  Interaction,
} from "discord.js";
import { searchYoutubeUrl } from "../lib/youtube";
import { getProminentColorHexCode } from "../lib/utiles";
import { IMetaData } from "../interfaces";

const button = new ButtonBuilder()
  .setLabel("skip")
  .setCustomId("skip")
  .setStyle(ButtonStyle.Primary);
export const playRow = new ActionRowBuilder().addComponents(button) as any;

// message factory
export async function playMessageEmbedFactory(metadata: IMetaData) {
  const prominetHexCode = (await getProminentColorHexCode(
    metadata.thumbnail.url
  )) as ColorResolvable;

  const playEmbed = new EmbedBuilder()
    .setColor(prominetHexCode)
    .setTitle(metadata.title)
    .setURL(`https://www.youtube.com/watch?${metadata.id}`)
    .setImage(metadata.thumbnail.url)
    .addFields(
      { name: "time", value: metadata.durationFormatted, inline: true },
      { name: "uploaded at", value: metadata.uploadedAt, inline: true }
    )
    .setTimestamp()
    .setFooter({
      text: metadata.channel.name,
      iconURL: metadata.channel.icon.url,
    });
  return playEmbed;
}

export async function playHandler(interaction: Interaction) {
  if (!interaction.isCommand()) return;
  const player = useMainPlayer();
  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  if (voiceChannel) {
    const term =
      interaction.options.get("term")?.value?.toString() ?? "michizure";
    const message = await interaction.editReply({
      content: "search for youtube url ...",
    });
    const youtubeUrl = await searchYoutubeUrl(term);
    if (!youtubeUrl) {
      message.edit("Error: youtube url doesn't exist");
      return;
    }
    await player.play(voiceChannel, youtubeUrl, {
      nodeOptions: { metadata: { message } },
    });
  } else {
    interaction.editReply("First, you must be on a voice channel.");
  }
}
