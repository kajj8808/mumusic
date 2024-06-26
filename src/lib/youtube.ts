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

export async function searchYoutubeListUrl(query: string): Promise<any> {
  try {
    const result = await youtube.search.list({
      q: query,
      maxResults: 3,
      part: ["snippet"],
      type: ["video", "music"],
      topicId: "/m/04rlf",
      videoDuration: "any",
      order: "relevance",
    });

    const notMVTitles = result.data.items?.filter((item) => {
      if (item.snippet?.title?.toLocaleLowerCase().includes("official")) {
        return false;
      }
      return true;
    });

    return notMVTitles?.map((video) => ({
      name: video.snippet?.title,
      value: video.id?.videoId,
    }));
  } catch (error) {
    console.error(error);
    return null;
  }
}
