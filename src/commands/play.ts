import {
  AudioPlayerStatus,
  createAudioPlayer,
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
import { resolve } from "bun";

interface AudioTrack {
  channelId: string;
  guildId: string;
  audioPath: string;
}
const audioQueue: AudioTrack[] = [];

const player = createAudioPlayer();

player.on(AudioPlayerStatus.Playing, () => {});

player.on("error", (error) => {
  console.error(`Audio player error: ${error}`);
});

player.on("stateChange", (oldState, newState) => {
  console.log(`Player state changed: ${oldState.status} -> ${newState.status}`);
});

async function checkAudioExists(videoId: string) {
  const audioFiles = fs.readdirSync(AUDIO_DIR);
  return audioFiles.some((file) => file.includes(videoId));
}

async function playAudio(connection: VoiceConnection, audioPath: string) {
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
  const term = interaction.options.get("term")?.value?.toString()!; // input option이 required임

  if (!voiceChannel || !guild) {
    console.error(
      "play commnad error: channel이나 guild가 없는거 같습니다(?)🤔"
    );
    return;
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

  const videoId = ytdl.getVideoID(term);

  console.log(player.state.status);

  const audioExists = await checkAudioExists(videoId);
  const audioFilePath = path.join(AUDIO_DIR, videoId);

  if (!audioExists) {
    // audio만 가져오는 filter로 했을경우 스트림이 종료되는 문제가 많이 발생해서 video와 같이 가져오는 방식 사용.
    const stream = ytdl(term, {
      filter: "audioandvideo",
    });
    const videoFilePath = path.join(AUDIO_DIR, `${videoId}.mp4`);
    const writeStream = fs.createWriteStream(videoFilePath);
    stream.pipe(writeStream);
    await new Promise((resolve) => writeStream.on("finish", resolve));
    await convertVideoToAudio(videoFilePath, audioFilePath);
  }

  playAudio(connection, audioFilePath);
  /* if (player.state.status === "idle") {
    
  } else {
    
    audioQueue.push({
      audioPath: audioFilePath,
      channelId: voiceChannel.id,
      guildId: guild.id,
    });
  } */

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
      .setName("term")
      .setDescription("song name or youtube url")
      .setRequired(true)
      .setAutocomplete(true)
  );
