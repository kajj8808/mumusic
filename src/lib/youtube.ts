import { google } from "googleapis";
const API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: API_KEY });

export async function searchYoutubeUrl(query: string) {
  try {
    const result = await youtube.search.list({
      q: query,
      maxResults: 5,
      part: ["snippet"],
      type: ["video", "music"],
      topicId: "/m/04rlf",
      videoDuration: "any",
      order: "relevance",
    });

    const notMVTitles = result.data.items?.filter((item) => {
      if (item.snippet?.title?.includes("MV")) {
        return false;
      }
      if (item.snippet?.title?.toLocaleLowerCase().includes("official")) {
        return false;
      }
      return true;
    });

    const videoId = notMVTitles![0].id?.videoId;
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch (error) {
    console.error(error);
    return null;
  }
}
