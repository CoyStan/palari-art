import type { PalariV3Selection } from "./data";
import { renderPalariSvg } from "./procedural";

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

async function avatarSource(avatar: PalariV3Selection) {
  if (avatar.rig) {
    const objectUrl = URL.createObjectURL(new Blob([renderPalariSvg(avatar.rig)], { type: "image/svg+xml" }));
    return { source: objectUrl, release: () => URL.revokeObjectURL(objectUrl) };
  }
  if (avatar.kind !== "bundled") throw new Error("The generated avatar has no SVG rig.");
  return { source: avatar.icon, release: () => undefined };
}

export async function downloadAvatar(avatar: PalariV3Selection, frame: AvatarFrame) {
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

  const { source, release } = await avatarSource(avatar);
  try {
    const image = await loadImage(source);
    context.drawImage(image, 0, 0, outputSize, outputSize);
  } finally {
    release();
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The avatar could not be exported.");
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${avatar.name.toLowerCase()}-palari-avatar.png`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
