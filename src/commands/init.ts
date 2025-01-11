import { REST, Routes, SlashCommandBuilder } from "discord.js";
import path from "path";
import fs from "fs";

async function getCommands() {
  const commands: SlashCommandBuilder[] = [];
  const commandDir = path.join(__dirname);
  const commandFiles = fs.readdirSync(commandDir);

  for (const commandFile of commandFiles) {
    if (!commandFile.endsWith(".ts")) {
      continue;
    }
    const filePath = path.join(commandDir, commandFile);
    const command = require(filePath);
    if ("command" in command) {
      commands.push(command.command.toJSON());
    }
  }
  return commands;
}

export async function discordCommandInit() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const serverId = process.env.DISCORD_SERVER_ID;
  if (!botToken || !clientId || !serverId) {
    console.error(
      ".env 파일에[DISCORD_BOT_TOKEN , DISCORD_CLIENT_ID , DISCORD_SERVER_ID]값에 문제가 있는듯 합니다. command 업데이트를 종료합니다.😥"
    );
    return undefined;
  }
  const rest = new REST().setToken(botToken);
  const commands = await getCommands();
  console.log(
    `Started refreshing ${commands.length} application (/) commands.`
  );
  await rest.put(Routes.applicationGuildCommands(clientId, serverId), {
    body: commands,
  });
  console.log(
    `Successfully reloaded ${commands.length} application (/) commands.`
  );
}
