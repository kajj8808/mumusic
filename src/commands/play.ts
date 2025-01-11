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
import { createReadStream } from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
const sampleAudioPath = path.join(
  __dirname,
  "../../sample",
  "audio",
  "output.mp3"
);
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
    console.error("이 명령어는 공개 채널(Guild)내에서만 사용 가능합니다.");
    return undefined;
  }
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;
  const guild = interaction.guild;

  if (!voiceChannel || !guild) {
    console.error(
      "play commnad error: channel이나 guild가 없는거 같습니다(?)🤔"
    );
    return undefined;
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
    // FIXME: 이부분 고정 -> 동적 변경
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);

    await new Promise((resolve) => writeStream.on("finish", resolve));

    //await convertVideoToAudio(filePath, outputPath);
    console.log("is Close ");
    // const audioStream = createReadStream(stream);
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
/* .addStringOption((input) =>
    input
      .setName("term")
      .setDescription("song name or yotube url!")
      .setAutocomplete(true)
  ) */

(async () => {
  //const result = await ytdl.("michizure");
  // console.log(result);
  /*   ytdl("http://www.youtube.com/watch?v=aqz-KE-bpKQ").pipe(
    require("fs").createWriteStream("video.mp4")
  ); */
})();

async function convertVideoToAudio(videoPath: string, outputPath: string) {
  return new Promise((resolve) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .outputOption("-c:a libopus")
      .on("end", () => {
        resolve(true);
      })
      .on("progress", (progress) => {
        console.log(`convert video to audio: ${progress}`);
      })
      .on("error", (error) => {
        console.error(error);
      });
  });
}

(async () => {
  const videoId = ytdl.getVideoID(
    "https://www.youtube.com/watch?v=Ju9OLNOBxeg"
  );

  const videoInfo = await ytdl.getInfo(
    "https://www.youtube.com/watch?v=Ju9OLNOBxeg"
  );

  const videoStream = ytdl("https://www.youtube.com/watch?v=Ju9OLNOBxeg", {
    filter: "audio",
  });

  const output = path.join(__dirname, "../../sample/audio/", `${videoId}.mp3`);
  console.log("저장");

  const writeStream = fs.createWriteStream(output);
  videoStream.pipe(writeStream);

  writeStream.on("close", () => {
    console.log("on finish");
  });

  videoStream.on("end", () => {
    console.log("스트림 종료");
  });

  videoStream.on("progress", (chunk) => {
    console.log("데이터 청크:", chunk);
  });

  videoStream.on("error", (error) => {
    console.error(`스트림 오류: ${error}`);
  });
  /* 
  
  videoStream.on("data", (chunk) => {
    console.log("데이터 청크:", chunk.length);
  }); */

  /*  ffmpeg(stream)
    .outputOption("-c:a libopus")
    .on("progress", (progress) => {
      console.log(`convert video to audio: ${progress}`);
    })
    .output("test.mp3"); */
})();
