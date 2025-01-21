import {
  AudioPlayer,
  createAudioPlayer as createDiscordVoicePlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  ActionRowBuilder,
  EmbedBuilder,
  Guild,
  GuildMember,
  SlashCommandBuilder,
  type ColorResolvable,
  type GuildTextBasedChannel,
  type Interaction,
} from "discord.js";
import path from "path";
import fs from "fs";
import ytdl, { getVideoID } from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { AUDIO_DIR } from "../constants";
import { skipButton } from "../buttons/skip";
import { playlistButton } from "../buttons/playlist";
import { searchYoutube } from "../lib/youtube";
import { formatSecondsToMinutes } from "../lib/utils";
import { stopButton } from "../buttons/stop";

interface SongInfo {
  videoTitle: string;
  videoUrl: string;
  channelName: string;
  thumbnail: string;
  audioPath: string;
  description: string | null;
  duration: string;
}

interface AudioPlayerState {
  voiceChannelId: string;
  guild: Guild;
  textChannel: GuildTextBasedChannel;
  interaction: Interaction;
  playList: SongInfo[];
  player: AudioPlayer;
}
const audioPlayerStates: AudioPlayerState[] = [];

interface GenerateProgressMarkDownProps {
  title?: string;
  description?: string;
  barLength: number;
  percentage: number;
}

function generateProgressMarkdown({
  title,
  barLength,
  description,
  percentage,
}: GenerateProgressMarkDownProps) {
  const progressBarLength = barLength;
  let progressBar = "";
  if (title) {
    progressBar += `**${title}**\n`;
  }
  if (description) {
    progressBar += `${description}\n`;
  }

  progressBar += `${":blue_square:".repeat(
    Math.floor(percentage)
  )}${":white_large_square:".repeat(
    progressBarLength - Math.floor(percentage)
  )}`;
  return progressBar;
}

/** audio player를 만들어주는 함수 guid, voice channel마다 다른 player를 사용하기 위해 사용.  */
function createAudioPlayer() {
  const player = createDiscordVoicePlayer();
  player.on("error", (error) => {
    console.error(`Audio player error: ${error}`);
  });
  return player;
}

export function stopSong(guildId: string, voiceChannelId: string) {
  const playerState = findPlayerState(guildId, voiceChannelId);
  if (!playerState) {
    console.error("플레이어를 찾을 수 없습니다.");
    return;
  }
  const player = playerState.player;
  player.stop();
  for (let i = 0; i < audioPlayerStates.length; i++) {
    if (
      audioPlayerStates[i].guild.id === guildId &&
      audioPlayerStates[i].voiceChannelId === voiceChannelId
    ) {
      audioPlayerStates.splice(i, 1);
      break;
    }
  }
}

async function checkAudioExists(videoId: string) {
  const audioFiles = fs.readdirSync(AUDIO_DIR);
  return audioFiles.some((file) => file.includes(videoId));
}

function findPlayerState(guildId: string, voiceChannelId: string) {
  return audioPlayerStates.find(
    (audioPlayer) =>
      audioPlayer.guild.id === guildId &&
      audioPlayer.voiceChannelId === voiceChannelId
  );
}

export function getPlayList(guildId: string, voiceChannelId: string) {
  const playerState = findPlayerState(guildId, voiceChannelId);
  return playerState?.playList;
}

export function skipSong(guildId: string, voiceChannelId: string) {
  const playerState = findPlayerState(guildId, voiceChannelId);
  if (!playerState) {
    console.error("player not found error... skipSong");
    return;
  }
  if (playerState.playList.length > 0) {
    playSong(guildId, voiceChannelId);
  } else {
    const interaction = playerState.interaction as any;
    interaction.replay("🔥 playlist is empty.. 🔥");
  }
}

function getAudioPlayer(guildId: string, voiceChannelId: string) {
  const currentAudioPlayer = findPlayerState(guildId, voiceChannelId);
  return currentAudioPlayer?.player;
}

function addSong(guildId: string, voiceChannelId: string, songInfo: SongInfo) {
  const audioPlayer = findPlayerState(guildId, voiceChannelId);
  audioPlayer?.playList.push(songInfo);
}

async function playSong(guildId: string, voiceChannelId: string) {
  const currentAudioPlayer = findPlayerState(guildId, voiceChannelId);
  if (!currentAudioPlayer) {
    console.error("오디오 플레이어를 찾을 수 없습니다.");
    return;
  }

  const connection = getVoiceConnection(guildId);
  if (!connection) {
    console.error("음성 채널이 존재하지 않습니다.");
    return;
  }

  const songInfo = currentAudioPlayer.playList.pop();
  if (!songInfo) {
    console.error("재생할 노래가 없습니다.");
    return;
  }

  try {
    const player = currentAudioPlayer.player;
    const audioStream = fs.createReadStream(songInfo.audioPath);
    const audioResource = createAudioResource(audioStream);
    player.play(audioResource);
    connection.subscribe(player);

    const playerEmbed = await buildPlayerEmbed(songInfo);
    const row = new ActionRowBuilder()
      .addComponents(skipButton)
      .addComponents(playlistButton)
      .addComponents(stopButton) as any;
    const embedsMessage = await currentAudioPlayer.textChannel.send({
      embeds: [playerEmbed],
      components: [row],
    });

    const progressInterval = setInterval(async () => {
      const progress = Math.ceil(audioResource.playbackDuration / 1000);
      const totalDuration = parseInt(songInfo.duration);
      const progressBarLength = 18;
      const progressPercentage = (progress / totalDuration) * progressBarLength; // bar길이에 대한 진행도.
      const progressBar = generateProgressMarkdown({
        description: `:notes: [${formatSecondsToMinutes(
          progress.toString()
        )}/${formatSecondsToMinutes(totalDuration.toString())}]`,
        barLength: progressBarLength,
        percentage: progressPercentage,
      });

      if (audioResource.ended === true) {
        clearInterval(progressInterval);
        const playerEmbed = await buildPlayerEmbed(songInfo);
        await embedsMessage.edit({
          embeds: [playerEmbed],
          components: [],
        });
      } else {
        const playerEmbed = await buildPlayerEmbed(songInfo, progressBar);
        embedsMessage.edit({
          embeds: [playerEmbed],
        });
      }
    }, 1000);
  } catch (error) {
    const videoId = getVideoID(songInfo.videoUrl);
    const audios = fs.readdirSync(AUDIO_DIR);
    // 문제가 있는 파일들 ( 파일이 손상 되었을 경우나, 변환이 재대로 되지 않았을 경우 )
    for (const audioPath of audios) {
      if (audioPath.includes(videoId)) {
        fs.rmSync(path.join(AUDIO_DIR, audioPath));
      }
    }

    await currentAudioPlayer.textChannel.send(
      `❌ ${videoId} - 스트림이나 파일이 손상되었습니다 다시 시도해 주세요.`
    );
  }
}

function getOriginalThumnail(thumbnails: ytdl.thumbnail[]) {
  let originalWidth = 0;
  let originalThumnail = "";
  for (let thumbnail of thumbnails) {
    if (originalWidth < thumbnail.width) {
      originalWidth = thumbnail.width;
      originalThumnail = thumbnail.url;
    }
  }
  return originalThumnail;
}

async function convertVideoToAudio(videoPath: string, audioPath: string) {
  return await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      const audioCodec = metadata.streams.find(
        (stream) => stream.codec_type === "audio"
      )?.codec_name;
      // ffmpeg가 .webm의 상태에서 aac 코덱을 가진 영상이 들어오면 고장나는문제 + acc코덱을 opus로 변환하는데 문제가 있는 관계로...
      let tempAudioPath = audioPath;
      if (audioCodec === "aac") {
        tempAudioPath = `${tempAudioPath}.mp3`;
      } else {
        tempAudioPath = `${tempAudioPath}.webm`;
      }

      ffmpeg()
        .input(videoPath)
        .output(tempAudioPath)
        .outputOption("-vn")
        .audioBitrate("128k")
        .on("end", () => {
          fs.rmSync(videoPath);
          fs.renameSync(tempAudioPath, audioPath);
          resolve(true);
        })
        .on("error", (error) => {
          reject({
            name: `convertVideoToAudio error ${error}`,
            error: error,
          });
        })
        .run();
    });
  });
}

async function updateTextChannelAndInteraction({
  guid,
  voiceChannelId,
  textChannel,
  interaction,
}: {
  guid: Guild;
  voiceChannelId: string;
  textChannel: GuildTextBasedChannel;
  interaction: Interaction;
}) {
  const playerState = findPlayerState(guid.id, voiceChannelId);

  const existingIndex = audioPlayerStates.findIndex(
    (state) => state.guild === guid && state.voiceChannelId === voiceChannelId
  );
  if (existingIndex !== 1 && playerState) {
    const updatedPlayerState = playerState;
    updatedPlayerState.textChannel = textChannel;
    updatedPlayerState.interaction = interaction;
    audioPlayerStates[existingIndex] = updatedPlayerState;
  }
}

export async function play(interaction: Interaction) {
  if (!interaction.inGuild()) {
    console.error("이 명령어는 채널(Guild)내에서만 사용 가능합니다.");
    return;
  }

  if (!interaction.isCommand()) {
    return;
  }
  let reply = await interaction.deferReply();

  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  const guild = interaction.guild;

  const query = interaction.options.get("query")?.value?.toString()!; // input option이 required임

  if (!voiceChannel || !guild || !interaction.channel) {
    reply.edit("play commnad error: channel이나 guild가 없는거 같습니다(?)🤔");
    return;
  }

  let player = getAudioPlayer(guild.id, voiceChannel.id);
  if (!player) {
    const newPlayerState: AudioPlayerState = {
      player: createAudioPlayer(),
      guild: guild,
      playList: [],
      voiceChannelId: voiceChannel.id,
      textChannel: interaction.channel,
      interaction: interaction,
    };

    player = newPlayerState.player;
    // player 인스턴스 상태 변경 이벤트 등록.
    player.on("stateChange", (oldState, newState) => {
      console.log(
        `Player state changed: ${oldState.status} -> ${newState.status}`
      );
      if (newState.status === "idle") {
        playSong(guild.id, voiceChannel.id).catch((error) => {
          console.error("오디오 재생 중 오류 발생:", error);
        });
      }
    });

    audioPlayerStates.push(newPlayerState);
  }
  updateTextChannelAndInteraction({
    guid: guild,
    interaction: interaction,
    textChannel: interaction.channel,
    voiceChannelId: voiceChannel.id,
  });
  const connection = joinVoiceChannel({
    debug: true,
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  if (connection.state.status !== "ready") {
    // voice connection status가 ready상태가 될 떄 까지 기다리는 코드
    await new Promise((resolve) => {
      connection.on(VoiceConnectionStatus.Ready, async () => {
        resolve(true);
      });
    });
  }

  await reply.edit("🔎 유튜브 검색중..");

  let videoId = undefined;
  try {
    videoId = ytdl.getVideoID(query);
  } catch (error) {
    const searchResult = await searchYoutube(query, 1);
    if (!searchResult) {
      await reply.edit("😥 YOUTUBE API KEY 할당량 초과..");
      return;
    }
    videoId = searchResult[0].id.videoId;
  }

  const videoInfo = await ytdl.getInfo(videoId);
  const audioExists = await checkAudioExists(videoId);
  const audioFilePath = path.join(AUDIO_DIR, videoId);

  if (!audioExists) {
    await reply.edit("🌐 유튜브에서 영상 스트림 다운로드 중..");
    try {
      // audio만 가져오는 filter로 했을경우 스트림이 종료되는 문제가 많이 발생해서 video와 같이 가져오는 방식 사용.
      const stream = ytdl(videoId, {
        filter: "audioandvideo",
      });
      const videoFilePath = path.join(AUDIO_DIR, `${videoId}.mp4`);
      const writeStream = fs.createWriteStream(videoFilePath);
      stream.pipe(writeStream);
      await new Promise((resolve) => stream.on("done", resolve));
      await reply.edit("🪄 영상을 오디오로 전환 중...");
      await convertVideoToAudio(videoFilePath, audioFilePath);
    } catch (error) {
      await reply.edit(`Youtube Stream Error: ${error}`);
    }
  }

  const songInfo: SongInfo = {
    audioPath: audioFilePath,
    channelName: videoInfo.videoDetails.author.name,
    thumbnail: getOriginalThumnail(videoInfo.videoDetails.thumbnail.thumbnails),
    videoTitle: videoInfo.videoDetails.title,
    videoUrl: videoInfo.videoDetails.video_url,
    duration: videoInfo.videoDetails.lengthSeconds,
    description: videoInfo.videoDetails.description,
  };
  addSong(guild.id, voiceChannel.id, songInfo);

  if (player.state.status === "idle") {
    await reply.delete();
    playSong(guild.id, voiceChannel.id);
  } else {
    await reply.edit(
      `-# mumusic\nAdded ${songInfo.videoTitle} [${formatSecondsToMinutes(
        songInfo.duration.toString()
      )}]`
    );
  }

  connection.on("error", (error) => {
    console.error(`Connection error: ${error}`);
  });

  connection.on("stateChange", (oldState, newState) => {
    console.log(
      `Connection state changed: ${oldState.status} -> ${newState.status}`
    );
  });
}

async function buildPlayerEmbed(
  { channelName, thumbnail, videoTitle, videoUrl, description }: SongInfo,
  progressBar?: string
) {
  const safeDescription = description || "";
  const truncatedDescription =
    safeDescription.length > 100
      ? safeDescription.slice(0, 100) + "..."
      : safeDescription;

  return new EmbedBuilder()
    .setColor("DarkNavy")
    .setDescription(
      `-# mumusic\n\n**${channelName}**\n### [${videoTitle}](${videoUrl})\n\`\`\`${truncatedDescription}\`\`\` \n${
        progressBar ?? ""
      }`
    )
    .setImage(thumbnail)
    .setTimestamp();
}

export const command = new SlashCommandBuilder()
  .setName("play")
  .setDescription("add song name or youtube url!")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("song name or youtube url")
      .setRequired(true)
      .setAutocomplete(true)
  );
