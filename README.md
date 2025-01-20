# Mumusic

[Bun 1.1.37](https://bun.sh)
Discord music bot

## 목표

- [x] 이전 버전에서 일어 났던 문제 해결
  - [x] youtube stream이 중간에 중지 되어 노래가 끊키는 문제
  - [x] discord interaction이 중지되는 문제
- [] discord message
  - [x] skip button
  - [] stop button
  - [x] list button ( queue에 있는 음악 )
  - [x] 각각 error에 대한 message
  - [] 로딩에 대한 message ( 가능하면 처리 과정도 포함 + 이전 메세지를 저장해서 현재 상태를 보여줄수 있게 )
  - [x] play중에만 button이 뜨게 하기.

## Commads

- [x] play
  - [x] youtube url
  - [x] 유튜브 검색어

## Config

[Discord Token](https://discord.com/developers/applications/)

## To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

### @distube/ytdl에서 end 이벤트가 발생하지 않는 문제 수정 사항 (실행 전 필수 수정!)

유튜브 스트림을 가져오기 위해 사용한 `@distube/ytdl-core` 라이브러리에서 `end` 이벤트가 발생하지 않는 문제가 발생해 코드 수정.

```javascript
node_modules/@distube/ytdl-core/lib/index.js

  stream.setMaxListeners(0);
  let contentLength,
    downloaded ,totalReceived = 0;

  stream.on("error", ()=>{
    stream.emit('error' , "stream close error...");
  })

  const ondata = chunk => {
    downloaded += chunk.length;
    stream.emit('progress', chunk.length, downloaded, contentLength);

    totalReceived += chunk.length;
    if (totalReceived >= contentLength) {
      try {
        stream.end()
        stream.close();
      } catch (error) {
        stream.emit('error', "Error closing stream: " + error.message);
      }
      return;
    }

  };

```

## Newest Versions

[muMusic-2024](https://github.com/kajj8808/Mumusic/tree/muMusic-2024)
[2023-02](https://github.com/kajj8808/discord-musicbot-2023-02)
[2021-06](https://github.com/kajj8808/discord_music_bot_2021-06)

### 확인된 문제

- [x] ytdl close 부분에서 error가 나오는 경우가 있음.
- [x] 스트림 파일이 모두 처리되지 못해서 파일이 문제가 있는 경우가 있음 ( 그런 경우 재생시 에러 메세지를 내고 파일을 삭제.. )
