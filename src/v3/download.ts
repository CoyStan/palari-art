import type { PalariV3Avatar } from "./data";

export type AvatarFrame = "soft" | "circle" | "square";

const outputSize = 1024;

function roundedRectangle(context: CanvasRenderingContext2D, radius: number) {
  context.beginPath();
  context.roundRect(0, 0, outputSize, outputSize, radius);
  context.clip();
}

async function loadImage(source: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = source;
  await image.decode();
  return image;
}

export async function downloadAvatar(avatar: PalariV3Avatar, frame: AvatarFrame) {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  if (frame === "circle") {
    context.beginPath();
    context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    context.clip();
  } else if (frame === "soft") {
    roundedRectangle(context, 168);
  }

  const image = await loadImage(avatar.icon);
  context.drawImage(image, 0, 0, outputSize, outputSize);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The avatar could not be exported.");
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${avatar.name.toLowerCase()}-palari-avatar.png`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
