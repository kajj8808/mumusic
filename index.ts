import { Client } from "discord.js";
import spotipy from "./spotipy";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({ intents: [] });

spotipy();

// client.login();
