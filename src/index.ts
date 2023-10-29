import { GuildQueuePlayerNode, Player, Track } from "discord-player";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import dotenv from "dotenv";
import { sleep } from "./utiles";
import { initalCommandLoading } from "./discord";
dotenv.config();

// initalCommandLoading();

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"],
});

const player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 26,
  },
});

player.events.on("error", (error) => {
  console.log(`Player Error : ${error}`);
});

function playMessageFactory(track: Track) {
  const embed = new EmbedBuilder()
    .setTitle(track.title)
    .setThumbnail(track.thumbnail)
    .setTimestamp()
    .setURL(track.url)
    .setDescription(`${track.description} (${track.duration})`);
  // buttons [https://discordjs.guide/message-components/buttons.html#button-styles]
  const stopButton = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("STOP")
    .setStyle(ButtonStyle.Secondary);

  const skipButton = new ButtonBuilder()
    .setCustomId("skip")
    .setLabel("SKIP")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(stopButton, skipButton);

  return {
    embeds: [embed],
    components: [row],
  };
}

player.events.on("playerStart", async (query, track) => {
  await query.metadata.interaction.editReply({ ...playMessageFactory(track) });
});

player.events.on("audioTrackAdd", async (queue, track) => {
  if (!queue.currentTrack) return; // init 의 경우
  queue.metadata.interaction.followUp(`Added ${track.title}`);
});

client.on("error", (error) => {
  console.log(`Client Error : ${error}`);
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  await player.extractors.loadDefault();
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const queue = player.queues.get(interaction.guild!);
    const queueNode = new GuildQueuePlayerNode(queue!);
    if (!queueNode.isPlaying) return;
    await interaction.deferReply();
    switch (interaction.customId) {
      case "stop":
        await player.destroy();
        await interaction.editReply("bye bye");
        break;
      case "skip":
        queueNode.skip();
        const skippedMessage = await interaction.editReply("skip");
        await sleep(5);
        skippedMessage.delete();
        break;
    }
    return;
  }
  if (interaction.isCommand()) {
    const term = interaction.options.get("term")?.value?.toString();
    const queue = player.queues.get(interaction.guild!);
    if (!queue) {
      await interaction.deferReply();
    } else {
      await interaction.deferReply();
      await interaction.deleteReply();
    }

    switch (interaction.commandName) {
      case "play":
        if ((interaction.member as GuildMember).voice.channel) {
          const track = await player.search(term!, {
            requestedBy: interaction.user.id,
            searchEngine: "youtube",
          });
          await player.play(
            (interaction.member as GuildMember).voice.channel!,
            track.tracks[0].url,
            {
              nodeOptions: {
                metadata: { interaction },
              },
            }
          );
        } else {
          await interaction.editReply("join voice channel...");
        }
        break;

      default:
        break;
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
