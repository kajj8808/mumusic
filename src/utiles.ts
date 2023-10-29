import axios from "axios";
import colorThief from "color-thief-node";
import fs from "fs";

export async function sleep(second: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, second * 1000);
  });
}

export async function getDominateColorFromYoutbeThumbnail(url: string) {
  /*   let result = "";
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const imgBuffer = Buffer.from(res.data, "binary");
  await fs.writeFileSync("thum.jpg", imgBuffer);

  const img = new Image();
  img.src = "thum.jpg";
  img.onload = function () {
    const dominateColor: any = colorThief.getColor(img);
    result = dominateColor;
    fs.unlinkSync("thum.jpg"); // 임시 이미지 삭제
  };
  return result; */
}
