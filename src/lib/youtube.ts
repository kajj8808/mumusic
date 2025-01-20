const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

interface YouTubeSearchResult {
  kind: string;
  etag: string;
  id: YouTubeVideoId;
  snippet: YouTubeSnippet;
}

interface YouTubeVideoId {
  kind: string;
  videoId: string;
}

interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnail[];
  channelTitle: string;
  liveBroadcastContent: string;
  publishTime: string;
}

interface YouTubeThumbnail {
  url: string;
  width?: number; // width가 있을 수도 있고 없을 수도 있음
  height?: number; // height가 있을 수도 있고 없을 수도 있음
}

export async function searchYoutube(query: string, maxResults: number) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: `${maxResults}`,
    key: API_KEY!,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`searchYoutube fetch error: ${response.status}`);
    }
    const data = await response.json();
    return data.items as YouTubeSearchResult[];
  } catch (error) {
    console.error(`searchYoutube error: ${error}`);
    return undefined;
  }
}
