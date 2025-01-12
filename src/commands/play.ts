import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { GuildMember, SlashCommandBuilder, type Interaction } from "discord.js";
import path from "path";
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { AUDIO_DIR } from "../constants";

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

async function convertVideoToAudio(videoPath: string, audioPath: string) {
  return await new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .output(audioPath)
      .outputOption("-c:a copy")
      .outputOption("-vn")
      .on("end", () => {
        resolve(true);
      })
      .on("error", (error) => {
        reject({
          name: "convertVideoToAudio error",
          error: error,
        });
      })
      .run();
  });
}

export function play(interaction: Interaction) {
  if (!interaction.inGuild()) {
    console.error("이 명령어는 채널(Guild)내에서만 사용 가능합니다.");
    return;
  }

  if (!interaction.isCommand()) {
    return;
  }

  const voiceChannel = (interaction.member as GuildMember).voice.channel;
  const guild = interaction.guild;

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

  console.log(connection.state);

  connection.on(VoiceConnectionStatus.Ready, async () => {
    const videoId = ytdl.getVideoID(
      "https://www.youtube.com/watch?v=Ju9OLNOBxeg"
    );

    const audioExists = await checkAudioExists(videoId);
    const audioFilePath = path.join(AUDIO_DIR, `${videoId}.mp3`);

    if (!audioExists) {
      const stream = ytdl("https://www.youtube.com/watch?v=Ju9OLNOBxeg", {
        filter: "audio",
      });
      const videoFilePath = path.join(AUDIO_DIR, `${videoId}.mp4`);
      const writeStream = fs.createWriteStream(videoFilePath);
      stream.pipe(writeStream);
      await new Promise((resolve) => writeStream.on("finish", resolve));
      await convertVideoToAudio(videoFilePath, audioFilePath);
    }

    const audioStream = fs.createReadStream(audioFilePath);
    const audioResource = createAudioResource(audioStream);
    player.play(audioResource);
    connection.subscribe(player);
  });

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
  .setDescription("add song name or youtube url!");
