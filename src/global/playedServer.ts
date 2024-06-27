interface IServer {
  id: string;
  isPlaying: boolean;
}
export let serverList: IServer[] = [];

export function addPlayedChannel(channelId: string) {
  serverList.push({
    id: channelId,
    isPlaying: true,
  });
}

export function checkPlayedChannel(channelId: string) {
  let isPlaying = false;
  for (let server of serverList) {
    if (server.id === channelId && server.isPlaying) {
      isPlaying = true;
    }
  }

  return isPlaying;
}

export function togglePlayedChannel(channelId: string) {
  const isVaild = Boolean(serverList.find((server) => server.id === channelId));
  if (isVaild) {
    serverList = serverList.map((server) =>
      server.id === channelId
        ? { id: server.id, isPlaying: !server.isPlaying }
        : server
    );
  } else {
    addPlayedChannel(channelId);
  }
}
