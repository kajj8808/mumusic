import { ApplicationCommandOptionType, REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();
interface ICommand {
  name: string;
  description: string;
  options?: [
    {
      name: string;
      description: string;
      type: ApplicationCommandOptionType;
      required: boolean;
    }
  ];
}

const commands: ICommand[] = [
  {
    name: "play",
    description: "play [term]",
    options: [
      {
        name: "term",
        description: "검색어 or youtube url",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];

/** command Factory 명령어 object 를 보내줘 처리를 하게해줌.! */
export function commandFactory(commandObj: ICommand) {
  commands.push(commandObj);
  sendCommandsToDiscordServer();
}
/** 앱이 실행될떄 commands 에 있는 값들을 등록해줍니다. */
export function initalCommandLoading() {
  sendCommandsToDiscordServer();
}

async function sendCommandsToDiscordServer() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
  try {
    console.log(
      "APP의 (/) 를 새로고침 하여 새로운 명령어를 등록하는 중입니다..."
    );
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
      body: [...commands],
    });
    console.log("APP의 (/) 를 새로고침 하여 명령어 등록에 성공하였습니다.");
  } catch (error) {
    console.log(error);
  }
}
