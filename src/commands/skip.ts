import { SlashCommandBuilder } from "discord.js";

export const command = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("skip on.. song!");
/* .addStringOption((input) =>
    input
      .setName("term")
      .setDescription("song name or yotube url!")
      .setAutocomplete(true)
  ) */
