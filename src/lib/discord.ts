import path from "path";
import fs from "fs";
import { REST, Routes } from "discord.js";

export function getCommandDatas() {
  const commands = [];
  const foldersPath = path.join(__dirname, "../commands");
  const commandFolder = fs.readdirSync(foldersPath);

  for (const file of commandFolder) {
    if (!file.endsWith(".ts")) {
      continue;
    }
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ("data" in command) {
      commands.push(command.data.toJSON());
    }
  }
  return commands;
}

export async function discordCommandInit() {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
  try {
    console.log(`Started refreshing ${1} application (/) commands.`);

    const data = (await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.DISCORD_SERVER_ID!
      ),
      {
        body: getCommandDatas(),
      }
    )) as any;

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
}
