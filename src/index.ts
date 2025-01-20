import { Client } from "discord.js";
import { play } from "./commands/play";
import { skip } from "./buttons/skip";
import { playlist } from "./buttons/playlist";

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

client.on("ready", (client) => {
  console.log(`👾 ${client.user.username} is online`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();
    const searchResult = await searchYoutube(focusedValue, 2);

    const options = searchResult.map((result) => {
      return {
        name: result.snippet.title,
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
    }
  }
});

async function main() {
  // command init은 시간이 오래걸리기에 개발 중에는 비활성화.
  // await discordCommandInit();
  client.login(process.env.DISCORD_BOT_TOKEN);
}
main();

import "../src/lib/youtube";
import { searchYoutube } from "../src/lib/youtube";
