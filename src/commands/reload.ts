import { spawn } from "bun";
import { SlashCommandBuilder } from "discord.js";

export const command = new SlashCommandBuilder()
  .setName("reload")
  .setDescription("application을 reload(재시작)합니다.");

export function reload() {
  spawn(["pm2", "restart", "mumusic"], { stdout: "inherit" });
}
