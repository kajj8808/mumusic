import { Player } from "discord-player";
import { Client, Message } from "discord.js";
import { IMetaData } from "../interfaces";
import { playMessageEmbedFactory, playRow } from "../commands/play";
import { sleep } from "./utiles";

declare global {
  var player: Player | undefined;
}

export async function playerLoad(client: Client) {
  if (!global.player) {
    const player = new Player(client, {
      ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 27,
      },
    });
    global.player = player;
    eventsInitial();
    await global.player.extractors.loadDefault();
  }
}

function eventsInitial() {
  global.player?.events.on("playerStart", async (queue, track) => {
    const message = queue.metadata.message as Message;
    const metadata = track.metadata as IMetaData;
    const messageEmbed = await playMessageEmbedFactory(metadata);

    await message.edit({
      content: null,
      embeds: [messageEmbed],
      components: [playRow],
    });
  });

  global.player?.events.on("audioTrackAdd", async (queue, track) => {
    const message = queue.metadata.message as Message;
    await message.edit({ content: null });
    const addedMessage = await message.channel.send(
      `added for ${track.title} 🎉`
    );

    await sleep(10);
    addedMessage.delete();
  });

  global.player?.events.on("playerSkip", async (queue, track) => {
    const message = queue.metadata.message as Message;
    const skipedMessage = await message.channel.send(
      `skiped for ${track.title} 🔥`
    );
    await sleep(10);
    skipedMessage.delete();
  });
}
