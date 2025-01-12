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

const player = createAudioPlayer();

player.on(AudioPlayerStatus.Playing, () => {
  // console.log("pppll~~~");
});

player.on("error", (error) => {
  console.error(`Audio player error: ${error}`);
});

player.on("stateChange", (oldState, newState) => {
  console.log(`Player state changed: ${oldState.status} -> ${newState.status}`);
});

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

  connection.on(VoiceConnectionStatus.Ready, async () => {
    const videoId = ytdl.getVideoID(
      "https://www.youtube.com/watch?v=Ju9OLNOBxeg"
    );
    const stream = ytdl("https://www.youtube.com/watch?v=Ju9OLNOBxeg", {
      filter: "audio",
    });

    const filePath = path.join(
      __dirname,
      "../../sample/audio/",
      `${videoId}.mp4`
    );
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);

    await new Promise((resolve) => writeStream.on("finish", resolve));

    const audioResource = createAudioResource(stream);
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
