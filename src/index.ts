import "dotenv/config";

import discord, { ApplicationCommandOptionType } from "discord.js";
import { playerLoad } from "./lib/player";
import { playHandler } from "./commands/play";
import { skipHandler } from "./commands/skip";
import { discordCommandInit } from "./lib/discord";
import db from "./lib/db";

const client = new discord.Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();

    const songs = await db.youtubeMusic.findMany({
      where: {
        name: {
          contains: focusedValue,
          mode: "insensitive",
        },
      },
      take: 5,
    });
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

client.on("ready", async () => {
  console.log(`${client.user?.username} is online.`);
  await playerLoad(client);
});

discordCommandInit();
client.login(process.env.DISCORD_BOT_TOKEN);
