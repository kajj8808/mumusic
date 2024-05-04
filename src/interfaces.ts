import { ApplicationCommandOptionType } from "discord.js";

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

export interface IMetaData {
  id: string;
  title: string;
  thumbnail: {
    id: string;
    width: number;
    height: number;
    url: string;
  };
  channel: {
    name: string;
    icon: {
      url: string;
      width: number;
      height: number;
    };
    subscribers: string;
  };
  views: number;
  uploadedAt: string;
  durationFormatted: string;
}
