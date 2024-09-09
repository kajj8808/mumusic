import { useMainPlayer } from "discord-player";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  GuildMember,
  Interaction,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { searchYoutubeUrl } from "../lib/youtube";
import { getProminentColorHexCode } from "../lib/utiles";
import { IMetaData } from "../interfaces";
import { checkPlayedChannel } from "../global/playedServer";
import { YoutubeiExtractor } from "discord-player-youtubei";

const button = new ButtonBuilder()
  .setLabel("skip")
  .setCustomId("skip")
  .setStyle(ButtonStyle.Primary);
export const playRow = new ActionRowBuilder().addComponents(button) as any;

// message factory
export async function playMessageEmbedFactory(metadata: IMetaData) {
  try {
    const prominetHexCode = (await getProminentColorHexCode(
      metadata.thumbnail.url
    )) as ColorResolvable;

    const playEmbed = new EmbedBuilder()
      .setColor(prominetHexCode)
      .setTitle(metadata.title)
      .setURL(`https://www.youtube.com/watch?v=${metadata.id}`)
      .setImage(metadata.thumbnail.url)
      .addFields(
        { name: "time", value: metadata.durationFormatted, inline: true },
        {
          name: "uploaded at",
          value: metadata.uploadedAt || "null",
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: metadata.channel.name,
        iconURL: metadata.channel.icon.url,
      });
    return playEmbed;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function playHandler(interaction: Interaction) {
  if (!interaction.isCommand()) return;
  const player = useMainPlayer();
  player.extractors.register(YoutubeiExtractor, {});
  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  if (voiceChannel) {
    const term =
      interaction.options.get("term")?.value?.toString() ?? "michizure";
    const message = await interaction.editReply({
      content: "search for youtube url ...",
    });

    let youtubeUrl;
    if (term.includes("https://www.youtube.com/")) {
      youtubeUrl = term;
    } else {
      youtubeUrl = await searchYoutubeUrl(term);
    }
    if (!youtubeUrl) {
      message.edit("Error: youtube url doesn't exist");
      return;
    }

    const channelId = voiceChannel.id;
    const isPlaying = checkPlayedChannel(channelId!);
    if (isPlaying) {
      message.delete();
    }

    await player.play(voiceChannel, youtubeUrl, {
      nodeOptions: { metadata: { message } },
    });
  } else {
    interaction.editReply("First, you must be on a voice channel.");
  }
}

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("add song name or youtube url")
  .addStringOption((option) =>
    option
      .setName("term")
      .setDescription("song name or youtube url")
      .setRequired(true)
      .setAutocomplete(true)
  );
