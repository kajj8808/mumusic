import "dotenv/config";

import discord from "discord.js";
import { playerLoad } from "./lib/player";
import { playHandler } from "./commands/play";
import { skipHandler } from "./commands/skip";
import { discordCommandInit } from "./lib/discord";
import db from "./lib/db";
import { searchYoutubeListUrl } from "./lib/youtube";

const client = new discord.Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();
    const searchSongs = await searchYoutubeListUrl(focusedValue);
    const prevSongs = await db.youtubeMusic.findMany({
      where: {
        name: {
          contains: focusedValue,
          mode: "insensitive",
        },
      },
      take: 2,
      orderBy: {
        id: "desc",
      },
    });
    const songs = [...searchSongs, ...prevSongs];
    await interaction.respond(
      songs.map((song) => ({ name: song.name, value: song.url }))
    );
  }
  if (interaction.isCommand()) {
    await interaction.deferReply();
    switch (interaction.commandName) {
      case "play":
        playHandler(interaction);
        break;
    }
  }
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case "skip":
        skipHandler(interaction);
        break;
      default:
        break;
    }
  }
});

/// 서버는 열리고 있는 ? 설치된거 받아올수 있게
client.on("ready", async (data) => {
  console.log(`${client.user?.username} is online.`);
  await playerLoad(client);
  console.log(data);
});

discordCommandInit();
client.login(process.env.DISCORD_BOT_TOKEN);
