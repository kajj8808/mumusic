import { Client } from "discord.js";

import { searchYoutube } from "../src/lib/youtube";

import { play } from "./commands/play";

import { skip } from "./buttons/skip";
import { playlist } from "./buttons/playlist";
import { stop } from "./buttons/stop";
import ytdl from "@distube/ytdl-core";

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

client.on("ready", (client) => {
  console.log(`👾 ${client.user.username} is online`);
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
  // command init은 시간이 오래걸리기에 개발 중에는 비활성화.
  // await discordCommandInit();
  client.login(process.env.DISCORD_BOT_TOKEN);
}
main();
