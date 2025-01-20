import { getAverageColor } from "fast-average-color-node";

export async function sleep(second: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, second * 1000);
  });
}

export async function getProminentColorHexCode(imageUrl: string) {
  let hexCode;
  try {
    // hexCode = (await Vibrant.from(imageUrl).getPalette()).Vibrant?.hex; <- webp 지원 x
    hexCode = (await getAverageColor(imageUrl)).hex;
  } catch (error) {
    console.log(error);
  }

  return hexCode ?? "#1f1f1f";
}
export function formatSecondsToMinutes(seconds: string) {
  const numSecond = parseInt(seconds);

  const minutes = Math.floor((numSecond % 3600) / 60);
  const remainingSeconds = numSecond % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}
