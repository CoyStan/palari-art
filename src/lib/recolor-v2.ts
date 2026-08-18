import { assetUrl } from "./assets";
import type { PalariV2Avatar } from "../v2/data";

export type V2RenderOptions = {
  material: string;
  characteristic: string;
  background: string;
  mode: "customized" | "original" | "emoticon";
  size?: number;
};

type PreparedMasks = {
  material: Uint8ClampedArray;
  characteristic: Uint8ClampedArray;
  materialLightness: number;
  characteristicLightness: number;
};

const sourceCache = new Map<string, Promise<ImageData>>();
const maskCache = new Map<string, Promise<PreparedMasks>>();
const emoticonCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(path: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${path}`));
    image.src = assetUrl(path);
  });
}

function pixelsFor(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function luminance(red: number, green: number, blue: number) {
  return (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
}

function averageLightness(source: ImageData, mask: Uint8ClampedArray) {
  let total = 0;
  let weight = 0;
  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    const amount = mask[pixel] / 255;
    if (amount < 0.2) continue;
    const offset = pixel * 4;
    total += luminance(source.data[offset], source.data[offset + 1], source.data[offset + 2]) * amount;
    weight += amount;
  }
  return weight ? total / weight : 0.5;
}

function prepareSource(avatar: PalariV2Avatar) {
  const cached = sourceCache.get(avatar.id);
  if (cached) return cached;

  const promise = loadImage(avatar.source).then(pixelsFor);
  sourceCache.set(avatar.id, promise);
  return promise;
}

function prepareMasks(avatar: PalariV2Avatar, source: ImageData) {
  const cached = maskCache.get(avatar.id);
  if (cached) return cached;

  const promise = Promise.all([
    loadImage(avatar.materialMask),
    loadImage(avatar.characteristicMask),
  ]).then(([materialImage, characteristicImage]) => {
    const material = pixelsFor(materialImage).data.filter((_, index) => index % 4 === 0);
    const characteristic = pixelsFor(characteristicImage).data.filter((_, index) => index % 4 === 0);
    return {
      material,
      characteristic,
      materialLightness: averageLightness(source, material),
      characteristicLightness: averageLightness(source, characteristic),
    };
  });

  maskCache.set(avatar.id, promise);
  return promise;
}

function parseHex(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function tintedChannel(target: number, sourceLightness: number, baseLightness: number) {
  const difference = sourceLightness - baseLightness;
  const targetUnit = target / 255;
  const adjusted = difference >= 0
    ? targetUnit + difference * (1 - targetUnit) * 1.4
    : targetUnit + difference * targetUnit * 1.4;
  return Math.round(Math.min(1, Math.max(0, adjusted)) * 255);
}

export async function renderPalariV2(
  canvas: HTMLCanvasElement,
  avatar: PalariV2Avatar,
  options: V2RenderOptions,
) {
  const size = options.size ?? 1024;
  if (options.mode === "emoticon") {
    let emoticon = emoticonCache.get(avatar.id);
    if (!emoticon) {
      emoticon = loadImage(avatar.emoticon);
      emoticonCache.set(avatar.id, emoticon);
    }
    const image = await emoticon;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");
    context.drawImage(image, 0, 0, size, size);
    return;
  }

  const source = await prepareSource(avatar);
  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = source.width;
  renderCanvas.height = source.height;
  const renderContext = renderCanvas.getContext("2d");
  if (!renderContext) throw new Error("Canvas rendering is unavailable.");

  const output = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  if (options.mode === "customized") {
    const prepared = await prepareMasks(avatar, source);
    const materialTarget = parseHex(options.material);
    const characteristicTarget = parseHex(options.characteristic);

    for (let pixel = 0; pixel < prepared.material.length; pixel += 1) {
      const offset = pixel * 4;
      if (output.data[offset + 3] === 0) continue;
      const sourceLightness = luminance(output.data[offset], output.data[offset + 1], output.data[offset + 2]);
      const characteristicAmount = prepared.characteristic[pixel] / 255;
      const materialAmount = prepared.material[pixel] / 255;

      const characteristicTint = characteristicTarget.map((channel) =>
        tintedChannel(channel, sourceLightness, prepared.characteristicLightness),
      );
      const materialTint = materialTarget.map((channel) =>
        tintedChannel(channel, sourceLightness, prepared.materialLightness),
      );

      for (let channel = 0; channel < 3; channel += 1) {
        const original = output.data[offset + channel];
        const withMaterial = original + (materialTint[channel] - original) * materialAmount;
        output.data[offset + channel] = Math.round(
          withMaterial + (characteristicTint[channel] - withMaterial) * characteristicAmount,
        );
      }
    }
  }

  renderContext.putImageData(output, 0, 0);
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  if (options.mode === "customized") {
    context.fillStyle = options.background;
    context.fillRect(0, 0, size, size);
  }
  context.drawImage(renderCanvas, 0, 0, size, size);
}
