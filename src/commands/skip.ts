import { useQueue } from "discord-player";
import { Guild, Interaction } from "discord.js";

export async function skipHandler(interaction: Interaction) {
  if (!interaction.isButton()) return;
  interaction.deferReply();
  const guild = interaction.guild as Guild;
  const queue = useQueue(guild.id);
  queue?.node.skip();
  interaction.deleteReply();
}
