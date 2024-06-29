# Mumusic

[NodeJsVersion 20.11.0](https://nodejs.org)
[TypeScript 5.2.2](https://www.typescriptlang.org/)

Discord music bot (Type script)

## 목표

- [x] 이전 버전에서 일어 났던 문제 ( interaction player 가 15분 이상 경과시 연결이 끊기는 문제) 를 해결
- [x] 플레이어가 특정 곡에 대해 재생을 못하는 문제 해결
- [x] MV/offical 버전의 영상은 필터링에서 거를 수 있도록 처리

## Commads

- [x] play (url , youtube serach)

## Buttons

- [x] skip button ( skip 기능 )
- [] stop button ( player 정지 기능 )

## Config

[Discord Token](https://discord.com/developers/applications/)

## Pakage

- discord.js ^14.14.1
- @discordjs/opus ^0.9.0
- @discordjs/voice ^0.16.1
- @discord-player/extractor ^4.4.7 ( discord player 을 사용할때 필수)
- discord-player ^6.6.8
- ffmepg-staic ^5.2.0
- sodium-native ^4.1.1

## Newest Version

[muMusic](https://github.com/kajj8808/muMusic/tree/muMusic)
[2023-02](https://github.com/kajj8808/discord-musicbot-2023-02)
[2021-06](https://github.com/kajj8808/discord_music_bot_2021-06)

## preview version

[LocalMusicFile PlayBot](https://github.com/kajj8808/discordMusicBotLocalFile)

## 만들면서 생긴 문제점

- 추출기(youtube 등..)를 초기에 로드를 해두지 않아 result가 없다는 문제 메세지를 많이봄... 초기 로딩 코드를 작성... -> await player.extractors.loadDefault();
