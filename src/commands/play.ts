import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer as createDiscordVoicePlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  EmbedBuilder,
  Guild,
  GuildMember,
  SlashCommandBuilder,
  type GuildTextBasedChannel,
  type Interaction,
} from "discord.js";
import path from "path";
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { AUDIO_DIR } from "../constants";

interface SongInfo {
  videoTitle: string;
  videoUrl: string;
  channelName: string;
  thumbnail: string;
  audioPath: string;
}

interface AudioPlayerState {
  voiceChannelId: string;
  guild: Guild;
  textChannel: GuildTextBasedChannel;
  playList: SongInfo[];
  player: AudioPlayer;
}
const audioPlayerStates: AudioPlayerState[] = [];

/** audio player를 만들어주는 함수 guid, voice channel마다 다른 player를 사용하기 위해 사용.  */
function createAudioPlayer() {
  const player = createDiscordVoicePlayer();
  player.on("error", (error) => {
    console.error(`Audio player error: ${error}`);
  });
  return player;
}

async function checkAudioExists(videoId: string) {
  const audioFiles = fs.readdirSync(AUDIO_DIR);
  return audioFiles.some((file) => file.includes(videoId));
}

function findAudioPlayer(guildId: string, voiceChannelId: string) {
  return audioPlayerStates.find(
    (audioPlayer) =>
      audioPlayer.guild.id === guildId &&
      audioPlayer.voiceChannelId === voiceChannelId
  );
}

function getAudioPlayer(guildId: string, voiceChannelId: string) {
  const currentAudioPlayer = findAudioPlayer(guildId, voiceChannelId);
  return currentAudioPlayer?.player;
}

function addSong(guildId: string, voiceChannelId: string, songInfo: SongInfo) {
  const audioPlayer = findAudioPlayer(guildId, voiceChannelId);
  audioPlayer?.playList.push(songInfo);
}

async function playSong(guildId: string, voiceChannelId: string) {
  const currentAudioPlayer = findAudioPlayer(guildId, voiceChannelId);
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

  const playerEmbed = buildPlayerEmbed(songInfo);
  currentAudioPlayer.textChannel.send({
    embeds: [playerEmbed],
  });

  const player = currentAudioPlayer.player;
  const audioStream = fs.createReadStream(songInfo.audioPath);
  const audioResource = createAudioResource(audioStream);
  player.play(audioResource);
  connection.subscribe(player);
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

export async function play(interaction: Interaction) {
  if (!interaction.inGuild()) {
    console.error("이 명령어는 채널(Guild)내에서만 사용 가능합니다.");
    return;
  }

  if (!interaction.isCommand()) {
    return;
  }
  let replyResponse = await interaction.deferReply();

  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  const guild = interaction.guild;
  // FIXME: query가 url인 상태임.. 여기 수정
  const query = interaction.options.get("query")?.value?.toString()!; // input option이 required임

  if (!voiceChannel || !guild || !interaction.channel) {
    replyResponse.edit(
      "play commnad error: channel이나 guild가 없는거 같습니다(?)🤔"
    );
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
    };
    player = newPlayerState.player;
    // player 인스턴스 상태 변경 이벤트 등록.
    newPlayerState.player.on("stateChange", (oldState, newState) => {
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

  const videoId = ytdl.getVideoID(query);

  const videoInfo = await ytdl.getInfo(query);
  const audioExists = await checkAudioExists(videoId);
  const audioFilePath = path.join(AUDIO_DIR, videoId);

  if (!audioExists) {
    // audio만 가져오는 filter로 했을경우 스트림이 종료되는 문제가 많이 발생해서 video와 같이 가져오는 방식 사용.
    const stream = ytdl(query, {
      filter: "audioandvideo",
    });
    const videoFilePath = path.join(AUDIO_DIR, `${videoId}.mp4`);
    const writeStream = fs.createWriteStream(videoFilePath);
    stream.pipe(writeStream);
    await new Promise((resolve) => writeStream.on("finish", resolve));
    await convertVideoToAudio(videoFilePath, audioFilePath);
  }
  const songInfo: SongInfo = {
    audioPath: audioFilePath,
    channelName: videoInfo.videoDetails.author.name,
    thumbnail: getOriginalThumnail(videoInfo.videoDetails.thumbnail.thumbnails),
    videoTitle: videoInfo.videoDetails.title,
    videoUrl: videoInfo.videoDetails.video_url,
  };
  addSong(guild.id, voiceChannel.id, songInfo);
  if (player.state.status === "idle") {
    playSong(guild.id, voiceChannel.id);
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

// TODO: 설명글도 넣어보기 ``` ```
function buildPlayerEmbed({
  channelName,
  thumbnail,
  videoTitle,
  videoUrl,
}: SongInfo) {
  return new EmbedBuilder()
    .setColor("DarkNavy")
    .setDescription(
      `-# mumusic\n**${channelName}**\n[**${videoTitle}**](${videoUrl})\n\n`
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
