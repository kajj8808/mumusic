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
import { searchYoutubeMusic } from "../lib/youtube";
import { getProminentColorHexCode } from "../lib/utiles";
import { checkPlayedChannel } from "../global/playedServer";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { TrackInfo } from "../interfaces";

const button = new ButtonBuilder()
  .setLabel("skip")
  .setCustomId("skip")
  .setStyle(ButtonStyle.Danger);
export const playRow = new ActionRowBuilder().addComponents(button) as any;

// message factory
export async function playMessageEmbedFactory(track: TrackInfo) {
  try {
    const prominetHexCode = (await getProminentColorHexCode(
      track.thumbnail
    )) as ColorResolvable;

    const playEmbed = new EmbedBuilder()
      .setColor(prominetHexCode)
      .setTitle(track.cleanTitle)
      .setURL(track.url)
      .setImage(track.thumbnail)
      .addFields({
        name: "duration",
        value: track.duration,
        inline: true,
      })
      .addFields({
        name: "views",
        value: track.views.toString(),
        inline: true,
      })
      .setTimestamp();
    /* .setFooter({
        text: metadata.channel.name,
        iconURL: metadata.,
      }); */
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

    const musicInfo = await searchYoutubeMusic(term);

    if (!musicInfo) {
      message.edit("Error: youtube info doesn't exist");
      return;
    }

    const channelId = voiceChannel.id;
    const isPlaying = checkPlayedChannel(channelId!);
    if (isPlaying) {
      message.delete();
    }

    await player.play(
      voiceChannel,
      `https://www.youtube.com/watch?v=${musicInfo.id?.videoId}`,
      {
        nodeOptions: { metadata: { message, musicInfo } },
      }
    );
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
