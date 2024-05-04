import { useMainPlayer, useQueue } from "discord-player";
import { Guild, Interaction } from "discord.js";

export async function skipHandler(interaction: Interaction) {
  if (!interaction.isButton()) return;
  const guild = interaction.guild as Guild;
  const queue = useQueue(guild.id);
  queue?.node.skip();
}
