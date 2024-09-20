import { Player } from "discord-player";
import { Client, Message } from "discord.js";
import { playMessageEmbedFactory, playRow } from "../commands/play";
import { sleep } from "./utiles";
import db from "./db";
import { togglePlayedChannel } from "../global/playedServer";
import { YoutubeiExtractor } from "discord-player-youtubei";

declare global {
  var player: Player | undefined;
}

export async function playerLoad(client: Client) {
  if (!global.player) {
    const player = new Player(client, {
      ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 28,
      },
    });
    await player.extractors.register(YoutubeiExtractor, {
      authentication: process.env.YOUTUBE_ACCESS_TOKEN,
    });
    await player.extractors.loadDefault();

    global.player = player;
    eventsInitial();
  }
}

function eventsInitial() {
  global.player?.events.on("playerStart", async (queue, track) => {
    const channelId = queue.channel?.id;
    togglePlayedChannel(channelId!);
    const message = queue.metadata.message as Message;
    // const musicInfo = queue.metadata.musicInfo as youtube_v3.Schema$SearchResult;
    const messageEmbed = await playMessageEmbedFactory(track);

    if (!messageEmbed) {
      await message.edit({
        content: "뭔가 뭔가 문제가 생김...",
      });
      return;
    }

    const isVaild = !Boolean(
      await db.youtubeMusic.findUnique({
        where: {
          name: track.title,
        },
      })
    );

    if (isVaild) {
      await db.youtubeMusic.create({
        data: {
          name: track.title,
          url: track.url,
          requestBy: message.interaction?.user.id
            ? message.interaction?.user.id
            : "Anon",
        },
      });
    }

    await message.edit({
      content: null,
      embeds: [messageEmbed],
      components: [playRow],
    });
  });

  global.player?.events.on("audioTrackAdd", async (queue, track) => {
    if (queue.isPlaying()) {
      const message = queue.metadata.message as Message;
      const messageChannel = message.channel as any;
      const addedMessage = await messageChannel.send(
        `added for ${track.title} 🎉`
      );
      await sleep(10);
      addedMessage.delete();
    }
  });

  global.player?.events.on("playerSkip", async (queue, track) => {
    const message = queue.metadata.message as Message;
    const messageChannel = message.channel as any;
    const skipedMessage = await messageChannel.send(
      `skiped for ${track.title} 🔥`
    );
    await sleep(10);
    skipedMessage.delete();
  });

  global.player?.events.on("emptyQueue", async (queue) => {
    const channelId = queue.channel?.id;
    togglePlayedChannel(channelId!);
  });
}
