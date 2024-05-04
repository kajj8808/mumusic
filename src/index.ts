import "dotenv/config";

import discord from "discord.js";
import { playerLoad } from "./lib/player";
import { playHandler } from "./commands/play";
import { skipHandler } from "./commands/skip";

const client = new discord.Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

client.on("interactionCreate", async (interaction) => {
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

client.login(process.env.DISCORD_BOT_TOKEN);
