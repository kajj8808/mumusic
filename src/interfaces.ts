import { ApplicationCommandOptionType, Message, TextChannel } from "discord.js";

export interface ICommand {
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

export interface TrackInfo {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  views: number;
  description: string;
  cleanTitle: string;
}

export interface TrackRow {
  source: "youtube" | "spotify";
  duration_ms: number;
  duration: string;
}
