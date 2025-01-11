# Mumusic

[Bun 1.1.37](https://bun.sh)
Discord music bot

## 목표

- [] 이전 버전에서 일어 났던 문제 해결
  - [] youtube stream이 중간에 중지 되어 노래가 끊키는 문제
  - [] discord interaction이 중지되는 문제

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
