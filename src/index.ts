import { Client, Guild } from "discord.js";

import { searchYoutube } from "../src/lib/youtube";

import { play } from "./commands/play";

import { skip } from "./buttons/skip";
import { playlist } from "./buttons/playlist";
import { stop } from "./buttons/stop";
import { reload } from "./commands/reload";
import { discordCommandInit } from "./commands/init";

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

client.on("ready", async (client) => {
  console.log(`👾 ${client.user.username} is online`);
  client.guilds.cache.forEach((guild) => discordCommandInit(guild.id));
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();
    const searchResult = await searchYoutube(focusedValue, 1);
    if (!searchResult) {
      return;
    }
    const options = searchResult.map((result) => {
      return {
        name: result.snippet.title.slice(1, 99),
        value: result.id.videoId,
      };
    });

    await interaction.respond(options);
  }
  if (interaction.isCommand()) {
    switch (interaction.commandName) {
      case "play":
        play(interaction);
        break;
      case "reload":
        await interaction.reply("애플리케이션을 재시작합니다...");
        reload();
        break;
    }
  }
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case "skip":
        skip(interaction);
        break;
      case "playlist":
        playlist(interaction);
        break;
      case "stop":
        stop(interaction);
        break;
    }
  }
});

async function main() {
  client.login(process.env.DISCORD_BOT_TOKEN);
}
main();
