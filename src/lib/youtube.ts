import { google } from "googleapis";
const API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube({ version: "v3", auth: API_KEY });

export async function searchYoutubeMusic(query: string) {
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

    if (result.data.items) {
      return result.data.items[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function searchYoutubeListUrl(query: string): Promise<any> {
  if (query === "") {
    return [];
  }
  try {
    const player = global.player;
    const searchResult = await player?.search(query, {
      searchEngine: "youtubeSearch",
    });
    const notMVTitles = searchResult?.tracks.filter((item) => {
      if (item.title.toLocaleLowerCase().includes("official")) {
        return false;
      }
      return true;
    });
    return notMVTitles
      ?.map((video) => ({
        name: video.title,
        url: video.url,
      }))
      .slice(0, 4);
  } catch (error) {
    console.error(error);
    return null;
  }
}
