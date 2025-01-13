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
import { GuildMember, SlashCommandBuilder, type Interaction } from "discord.js";
import path from "path";
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { AUDIO_DIR } from "../constants";

interface AudioPlayerState {
  voiceChannelId: string;
  guildId: string;
  playList: string[];
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
      audioPlayer.guildId === guildId &&
      audioPlayer.voiceChannelId === voiceChannelId
  );
}

function getAudioPlayer(guildId: string, voiceChannelId: string) {
  const currentAudioPlayer = findAudioPlayer(guildId, voiceChannelId);
  return currentAudioPlayer?.player;
}

function addSong(guildId: string, voiceChannelId: string, audioPath: string) {
  const audioPlayer = findAudioPlayer(guildId, voiceChannelId);
  audioPlayer?.playList.push(audioPath);
}

async function playAudio(guildId: string, voiceChannelId: string) {
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

  const audioPath = currentAudioPlayer.playList.pop();
  if (!audioPath) {
    console.error("재생할 노래가 없습니다.");
    return;
  }

  const player = currentAudioPlayer.player;
  const audioStream = fs.createReadStream(audioPath);
  const audioResource = createAudioResource(audioStream);
  player.play(audioResource);
  connection.subscribe(player);
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
        .audioBitrate("96k")
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

  const voiceChannel = (interaction.member as GuildMember).voice.channel;

  const guild = interaction.guild;
  const query = interaction.options.get("query")?.value?.toString()!; // input option이 required임

  if (!voiceChannel || !guild) {
    console.error(
      "play commnad error: channel이나 guild가 없는거 같습니다(?)🤔"
    );
    return;
  }

  let player = getAudioPlayer(guild.id, voiceChannel.id);
  if (!player) {
    const newPlayerState: AudioPlayerState = {
      player: createAudioPlayer(),
      guildId: guild.id,
      playList: [],
      voiceChannelId: voiceChannel.id,
    };
    player = newPlayerState.player;
    // player 인스턴스 상태 변경 이벤트 등록.
    newPlayerState.player.on("stateChange", (oldState, newState) => {
      console.log(
        `Player state changed: ${oldState.status} -> ${newState.status}`
      );
      if (newState.status === "idle") {
        playAudio(guild.id, voiceChannel.id).catch((error) => {
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

  addSong(guild.id, voiceChannel.id, audioFilePath);
  if (player.state.status === "idle") {
    playAudio(guild.id, voiceChannel.id);
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
