import { Player } from "discord-player";
import { Client, GuildMember } from "discord.js";
import dotenv from "dotenv";
import spotipy from "./spotipy";
dotenv.config();

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 26,
  },
});

player.on("error", (error) => {
  console.log(`Player Error : ${error}`);
});

client.on("error", (error) => {
  console.log(`Client Error : ${error}`);
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  await player.extractors.loadDefault();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    interaction.deferReply();
    if (interaction.commandName === "play") {
      const info = await spotipy.searchForItem("michizure");
      const songName = info?.name!;
      const track = await player.search(songName, {
        requestedBy: interaction.user.id,
        searchEngine: "youtube",
      });
      player.play(
        (interaction.member as GuildMember).voice.channel!,
        track.tracks[0].url
      );
      await interaction.editReply(
        `NowPlaying : ${info?.album.name} #${info?.name} ${info?.album.images[0]}`
      );
    }
  } catch (error) {
    await interaction.editReply(`Error: ${error}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
