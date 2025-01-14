# Mumusic

[Bun 1.1.37](https://bun.sh)
Discord music bot

## 목표

- [] 이전 버전에서 일어 났던 문제 해결
  - [] youtube stream이 중간에 중지 되어 노래가 끊키는 문제
  - [] discord interaction이 중지되는 문제
- [] discord message
  - [] skip button
  - [] stop button
  - [] list button ( queue에 있는 음악 )
  - [] 각각 error에 대한 message
  - [] 로딩에 대한 message ( 가능하면 처리 과정도 포함 + 이전 메세지를 저장해서 현재 상태를 보여줄수 있게 )
  - [] 가능 하다면 플레이어 메세지를 계속 수정하는 방식으로!

## Commads

- [] play
  - [] youtube url
  - [] 유튜브 검색어

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

let contentLength,
    downloaded = 0,
    totalReceived = 0;

const ondata = chunk => {
    // 수정 부분
    totalReceived += chunk.length;
    if (totalReceived >= contentLength) {
        stream.end(); // 스트림 종료
        stream.close(); // 스트림 닫기
        return;
    }

    downloaded += chunk.length;
    stream.emit('progress', chunk.length, downloaded, contentLength);
};
```

## Newest Versions

[muMusic-2024](https://github.com/kajj8808/Mumusic/tree/muMusic-2024)
[2023-02](https://github.com/kajj8808/discord-musicbot-2023-02)
[2021-06](https://github.com/kajj8808/discord_music_bot_2021-06)
