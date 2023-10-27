import axios, { toFormData } from "axios";

interface IToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}
async function getToken(): Promise<IToken | undefined> {
  const { status, data } = await axios<IToken>({
    url: "https://accounts.spotify.com/api/token",
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: {
      grant_type: "client_credentials",
      client_id: process.env.SPOTIPY_CLIENT_ID,
      client_secret: process.env.SPITIPY_CLIENT_SECRET,
    },
  });
  if (status !== 200) return undefined;
  return data;
}

interface ISearchForItemArgument {
  q: string;
  market?: string;
  type?:
    | "album"
    | "artist"
    | "playlist"
    | "track"
    | "show"
    | "episode"
    | "audiobook";
  limit?: number;
}
async function searchForItem(q: string, token: IToken) {
  const { status, data } = await axios({
    url: "https://api.spotify.com/v1/search",
    method: "get",
    headers: { Authorization: `${token.token_type} ${token.access_token}` },
    params: {
      q: q,
      type: "track",
      limit: 1,
    },
  });
  console.log(data.tracks.items[0]);
}

export default () => {
  (async () => {
    const token = await getToken();
    if (!token) return;
    await searchForItem("michizure", token);
  })();
};

/* 
      data:{
        
      } */
