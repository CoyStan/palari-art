import {
  clamp,
  colorDistance,
  hexToRgb,
  hslToRgb,
  hueDistance,
  mixChannel,
  rgbToHsl,
  type RGB,
} from "./color";

const OUTPUT_SIZE = 1024;
const MASK_SIZE = 512;

export type DetectionSettings = {
  backgroundTolerance: number;
  shirtTolerance: number;
};

export type RecolorSettings = DetectionSettings & {
  backgroundColor: string;
  shirtColor: string;
};

export type AvatarMaskSources = {
  foreground: string;
  matte: string;
  shirt: string;
};

type PreparedImage = {
  source: ImageData;
  foreground?: ImageData;
  backgroundMask: Uint8ClampedArray;
  shirtMask: Uint8ClampedArray;
  maskSize: number;
  backgroundReferenceLightness: number;
  shirtReferenceLightness: number;
};

const imageCache = new Map<string, HTMLImageElement>();
const preparedCache = new Map<string, PreparedImage>();
const IMAGE_CACHE_LIMIT = 24;
const PREPARED_CACHE_LIMIT = 6;

function cacheKey(src: string, settings: DetectionSettings, masks?: AvatarMaskSources) {
  if (masks) return `${src}|matte|${masks.foreground}|${masks.matte}|${masks.shirt}`;
  return `${src}|${settings.backgroundTolerance}|${settings.shirtTolerance}`;
}

function rememberPrepared(key: string, prepared: PreparedImage) {
  if (preparedCache.size >= PREPARED_CACHE_LIMIT) {
    const oldest = preparedCache.keys().next().value;
    if (oldest) preparedCache.delete(oldest);
  }
  preparedCache.set(key, prepared);
}

export async function loadImage(src: string) {
  const existing = imageCache.get(src);
  if (existing) return existing;

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The portrait image could not be loaded."));
    image.src = src;
    if (image.complete && image.naturalWidth > 0) resolve();
  });
  if (imageCache.size >= IMAGE_CACHE_LIMIT) {
    const oldest = imageCache.keys().next().value;
    if (oldest) imageCache.delete(oldest);
  }
  imageCache.set(src, image);
  return image;
}

function pixel(data: Uint8ClampedArray, offset: number): RGB {
  return { r: data[offset], g: data[offset + 1], b: data[offset + 2] };
}

async function loadImageData(src: string, width: number, height: number) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

async function loadMask(src: string, width: number, height: number) {
  const data = (await loadImageData(src, width, height)).data;
  const mask = new Uint8ClampedArray(width * height);
  for (let index = 0; index < mask.length; index += 1) mask[index] = data[index * 4];
  return mask;
}

function averageCornerColor(data: Uint8ClampedArray, width: number, height: number) {
  const patch = Math.max(8, Math.floor(width * 0.025));
  const samples: RGB[] = [];
  const corners = [
    [0, 0],
    [width - patch, 0],
  ];

  for (const [startX, startY] of corners) {
    for (let y = startY; y < startY + patch; y += 2) {
      for (let x = startX; x < startX + patch; x += 2) {
        samples.push(pixel(data, (y * width + x) * 4));
      }
    }
  }

  const totals = samples.reduce(
    (sum, sample) => ({
      r: sum.r + sample.r,
      g: sum.g + sample.g,
      b: sum.b + sample.b,
    }),
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: totals.r / samples.length,
    g: totals.g / samples.length,
    b: totals.b / samples.length,
  };
}

function blurMask(mask: Uint8ClampedArray, width: number, height: number, passes = 1) {
  let source = mask;

  for (let pass = 0; pass < passes; pass += 1) {
    const horizontal = new Uint8ClampedArray(source.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const left = source[y * width + Math.max(0, x - 1)];
        const center = source[y * width + x];
        const right = source[y * width + Math.min(width - 1, x + 1)];
        horizontal[y * width + x] = (left + center + right) / 3;
      }
    }

    const target = new Uint8ClampedArray(source.length);
    for (let y = 0; y < height; y += 1) {
      const aboveY = Math.max(0, y - 1);
      const belowY = Math.min(height - 1, y + 1);
      for (let x = 0; x < width; x += 1) {
        target[y * width + x] = (
          horizontal[aboveY * width + x]
          + horizontal[y * width + x]
          + horizontal[belowY * width + x]
        ) / 3;
      }
    }
    source = target;
  }

  return source;
}

function morphologyPass(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  mode: "min" | "max",
) {
  const horizontal = new Uint8ClampedArray(source.length);
  const initial = mode === "min" ? 255 : 0;
  const compare = mode === "min" ? Math.min : Math.max;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = initial;
      for (let offset = -radius; offset <= radius; offset += 1) {
        value = compare(value, source[y * width + Math.min(width - 1, Math.max(0, x + offset))]);
      }
      horizontal[y * width + x] = value;
    }
  }

  const vertical = new Uint8ClampedArray(source.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = initial;
      for (let offset = -radius; offset <= radius; offset += 1) {
        value = compare(
          value,
          horizontal[Math.min(height - 1, Math.max(0, y + offset)) * width + x],
        );
      }
      vertical[y * width + x] = value;
    }
  }

  return vertical;
}

function openMask(mask: Uint8ClampedArray, width: number, height: number, radius: number) {
  const eroded = morphologyPass(mask, width, height, radius, "min");
  return morphologyPass(eroded, width, height, radius, "max");
}

function closeMask(mask: Uint8ClampedArray, width: number, height: number, radius: number) {
  const dilated = morphologyPass(mask, width, height, radius, "max");
  return morphologyPass(dilated, width, height, radius, "min");
}

function detectBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  reference: RGB,
  tolerance: number,
) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const mask = new Uint8ClampedArray(total);
  const queue = new Uint32Array(total);
  let head = 0;
  let tail = 0;

  const add = (index: number) => {
    if (visited[index]) return;
    visited[index] = 1;
    const offset = index * 4;
    const distance = colorDistance(pixel(data, offset), reference);
    if (distance <= tolerance) queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width);
    add(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    mask[index] = 255;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (y > 0) add(index - width);
    if (y < height - 1) add(index + width);
  }

  return blurMask(mask, width, height, 2);
}

function getShirtReference(
  data: Uint8ClampedArray,
  backgroundMask: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const candidates: RGB[] = [];
  // Standardized portraits always leave garment visible at the bottom-center.
  // Sampling a compact low patch avoids head coverings, skin, and long hair
  // that may occupy much of the lower-middle portrait.
  const startY = Math.floor(height * 0.93);
  const endY = Math.floor(height * 0.985);
  const startX = Math.floor(width * 0.4);
  const endX = Math.floor(width * 0.6);

  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const index = y * width + x;
      if (backgroundMask[index] > 64) continue;
      candidates.push(pixel(data, index * 4));
    }
  }

  if (candidates.length === 0) return { r: 100, g: 100, b: 100 };

  // Use a channel median so knit highlights and shadows cannot skew the seed.
  const median = (values: number[]) => {
    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  };
  return {
    r: median(candidates.map((candidate) => candidate.r)),
    g: median(candidates.map((candidate) => candidate.g)),
    b: median(candidates.map((candidate) => candidate.b)),
  };
}

function maskedMedianLightness(
  data: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const samples: number[] = [];
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const index = y * width + x;
      if (mask[index] < 192) continue;
      samples.push(rgbToHsl(pixel(data, index * 4)).l);
    }
  }
  if (samples.length === 0) return 0.5;
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

function detectShirt(
  data: Uint8ClampedArray,
  backgroundMask: Uint8ClampedArray,
  width: number,
  height: number,
  reference: RGB,
  tolerance: number,
) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const mask = new Uint8ClampedArray(total);
  const queue = new Uint32Array(total);
  let head = 0;
  let tail = 0;
  const referenceHsl = rgbToHsl(reference);
  const absoluteMinY = Math.floor(height * 0.5);

  let sideForegroundSamples = 0;
  let similarSideSamples = 0;
  for (let y = Math.floor(height * 0.16); y < height * 0.6; y += 3) {
    for (let x = Math.floor(width * 0.08); x < width * 0.92; x += 3) {
      if (x > width * 0.34 && x < width * 0.66) continue;
      const index = y * width + x;
      if (backgroundMask[index] > 96) continue;
      sideForegroundSamples += 1;
      const sampleHsl = rgbToHsl(pixel(data, index * 4));
      if (
        hueDistance(sampleHsl.h, referenceHsl.h) < 22
        && Math.abs(sampleHsl.l - referenceHsl.l) < 0.28
        && sampleHsl.s > Math.max(0.08, referenceHsl.s * 0.3)
      ) {
        similarSideSamples += 1;
      }
    }
  }
  const hasSimilarHair = similarSideSamples > 400
    && similarSideSamples / Math.max(1, sideForegroundSamples) > 0.18;
  const hasSkinConflict = (referenceHsl.h < 55 || referenceHsl.h > 345)
    && referenceHsl.s > 0.2;
  const selectionTolerance = hasSimilarHair
    ? Math.min(tolerance, 40)
    : hasSkinConflict
      ? Math.min(tolerance, 48)
      : tolerance;

  const matches = (index: number) => {
    if (backgroundMask[index] > 96) return false;
    const sample = pixel(data, index * 4);
    const sampleHsl = rgbToHsl(sample);
    const hueLimit = 18 + selectionTolerance * 0.42;
    const lightnessLimit = hasSimilarHair || hasSkinConflict
      ? 0.14 + selectionTolerance / 500
      : 0.23 + selectionTolerance / 310;
    const saturationFloor = Math.max(0.05, referenceHsl.s * 0.26);
    const hueMatch = referenceHsl.s < 0.12
      ? Math.abs(sampleHsl.s - referenceHsl.s) < 0.22
      : hueDistance(sampleHsl.h, referenceHsl.h) < hueLimit
        && sampleHsl.s > saturationFloor;
    return hueMatch && Math.abs(sampleHsl.l - referenceHsl.l) < lightnessLimit;
  };

  const add = (index: number) => {
    if (visited[index]) return;
    visited[index] = 1;
    const y = Math.floor(index / width);
    const x = index % width;
    const normalizedX = x / width;
    // Garments form a shallow U around the neck: lower at the center, rising
    // toward the shoulders. This guard prevents similarly colored skin or a
    // head covering from joining the bottom-connected shirt region.
    const garmentFloor = hasSkinConflict
      ? height * (0.84 - Math.abs(normalizedX - 0.5) * 0.44)
      : hasSimilarHair
        ? height * (0.72 - Math.abs(normalizedX - 0.5) * 0.16)
        : height * (0.71 - Math.abs(normalizedX - 0.5) * 0.38);
    if (y < Math.max(absoluteMinY, garmentFloor) || !matches(index)) return;
    queue[tail++] = index;
  };

  const seedBands = hasSimilarHair
    ? [
        { y: height - 2, start: 0.38, end: 0.62, step: 2 },
        { y: Math.floor(height * 0.965), start: 0.38, end: 0.62, step: 2 },
      ]
    : hasSkinConflict
      ? [
          { y: height - 2, start: 0.08, end: 0.92, step: 3 },
          { y: Math.floor(height * 0.92), start: 0.08, end: 0.92, step: 3 },
          { y: Math.floor(height * 0.84), start: 0.08, end: 0.36, step: 3 },
          { y: Math.floor(height * 0.84), start: 0.64, end: 0.92, step: 3 },
        ]
      : [
          { y: height - 2, start: 0.08, end: 0.92, step: 3 },
          { y: Math.floor(height * 0.92), start: 0.08, end: 0.92, step: 3 },
          { y: Math.floor(height * 0.84), start: 0.08, end: 0.92, step: 3 },
        ];
  for (const { y, start, end, step } of seedBands) {
    for (let x = Math.floor(width * start); x < width * end; x += step) {
      add(y * width + x);
    }
  }

  while (head < tail) {
    const index = queue[head++];
    mask[index] = 255;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) add(index - 1);
    if (x < width - 1) add(index + 1);
    if (y > absoluteMinY) add(index - width);
    if (y < height - 1) add(index + width);
  }

  // When hair and garment hues overlap, opening removes thin winding strands.
  // Otherwise the raw connected garment mask retains textured knit details.
  const protectedMask = hasSimilarHair
    ? openMask(mask, width, height, 7)
    : closeMask(mask, width, height, 3);
  return blurMask(protectedMask, width, height, 1);
}

async function prepare(src: string, settings: DetectionSettings, masks?: AvatarMaskSources) {
  const key = cacheKey(src, settings, masks);
  const existing = preparedCache.get(key);
  if (existing) return existing;

  const image = await loadImage(src);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = OUTPUT_SIZE;
  sourceCanvas.height = OUTPUT_SIZE;
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.drawImage(image, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const source = context.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = MASK_SIZE;
  maskCanvas.height = MASK_SIZE;
  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskContext) throw new Error("Canvas is unavailable in this browser.");
  maskContext.drawImage(image, 0, 0, MASK_SIZE, MASK_SIZE);
  const maskSource = maskContext.getImageData(0, 0, MASK_SIZE, MASK_SIZE);
  const backgroundReference = averageCornerColor(maskSource.data, MASK_SIZE, MASK_SIZE);
  if (masks) {
    const [foreground, foregroundMatte, shirtMask] = await Promise.all([
      loadImageData(masks.foreground, OUTPUT_SIZE, OUTPUT_SIZE),
      loadMask(masks.matte, OUTPUT_SIZE, OUTPUT_SIZE),
      loadMask(masks.shirt, OUTPUT_SIZE, OUTPUT_SIZE),
    ]);
    const backgroundMask = new Uint8ClampedArray(foregroundMatte.length);
    for (let index = 0; index < foregroundMatte.length; index += 1) {
      backgroundMask[index] = 255 - foregroundMatte[index];
    }
    const prepared: PreparedImage = {
      source,
      foreground,
      backgroundMask,
      shirtMask,
      maskSize: OUTPUT_SIZE,
      backgroundReferenceLightness: rgbToHsl(backgroundReference).l,
      shirtReferenceLightness: maskedMedianLightness(
        source.data,
        shirtMask,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      ),
    };
    rememberPrepared(key, prepared);
    return prepared;
  }

  const backgroundMask = detectBackground(
    maskSource.data,
    MASK_SIZE,
    MASK_SIZE,
    backgroundReference,
    settings.backgroundTolerance,
  );
  const shirtReference = getShirtReference(
    maskSource.data,
    backgroundMask,
    MASK_SIZE,
    MASK_SIZE,
  );
  const shirtMask = detectShirt(
    maskSource.data,
    backgroundMask,
    MASK_SIZE,
    MASK_SIZE,
    shirtReference,
    settings.shirtTolerance,
  );
  const prepared: PreparedImage = {
    source,
    backgroundMask,
    shirtMask,
    maskSize: MASK_SIZE,
    backgroundReferenceLightness: rgbToHsl(backgroundReference).l,
    shirtReferenceLightness: rgbToHsl(shirtReference).l,
  };
  rememberPrepared(key, prepared);
  return prepared;
}

export async function renderRecoloredAvatar(
  canvas: HTMLCanvasElement,
  src: string,
  settings: RecolorSettings,
  masks?: AvatarMaskSources,
) {
  const prepared = await prepare(src, settings, masks);
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");

  const output = new ImageData(
    new Uint8ClampedArray(prepared.source.data),
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  const backgroundTarget = hexToRgb(settings.backgroundColor);
  const backgroundTargetHsl = rgbToHsl(backgroundTarget);
  const shirtTarget = rgbToHsl(hexToRgb(settings.shirtColor));

  for (let index = 0; index < OUTPUT_SIZE * OUTPUT_SIZE; index += 1) {
    const offset = index * 4;
    const original = pixel(prepared.source.data, offset);
    const x = index % OUTPUT_SIZE;
    const y = Math.floor(index / OUTPUT_SIZE);
    const maskScale = OUTPUT_SIZE / prepared.maskSize;
    const maskIndex = Math.floor(y / maskScale) * prepared.maskSize + Math.floor(x / maskScale);
    const backgroundAmount = prepared.backgroundMask[maskIndex] / 255;

    if (prepared.foreground) {
      const originalLightness = (Math.max(original.r, original.g, original.b)
        + Math.min(original.r, original.g, original.b)) / 510;
      const lightnessShift = (
        originalLightness - prepared.backgroundReferenceLightness
      ) * 0.32;
      const backgroundRgb = hslToRgb({
        h: backgroundTargetHsl.h,
        s: backgroundTargetHsl.s,
        l: clamp(backgroundTargetHsl.l + lightnessShift),
      });
      const foregroundAmount = 1 - backgroundAmount;
      const foregroundPixel = pixel(prepared.foreground.data, offset);
      const shirtAmount = prepared.shirtMask[maskIndex] / 255;
      let foregroundRgb = foregroundPixel;

      if (shirtAmount > 0) {
        const foregroundHsl = rgbToHsl(foregroundPixel);
        const lightnessDelta = foregroundHsl.l - prepared.shirtReferenceLightness;
        const recolored = hslToRgb({
          h: shirtTarget.h,
          s: clamp(shirtTarget.s * 0.9 + foregroundHsl.s * 0.1),
          l: clamp(shirtTarget.l + lightnessDelta * 0.92),
        });
        foregroundRgb = {
          r: mixChannel(foregroundPixel.r, recolored.r, shirtAmount),
          g: mixChannel(foregroundPixel.g, recolored.g, shirtAmount),
          b: mixChannel(foregroundPixel.b, recolored.b, shirtAmount),
        };
      }

      output.data[offset] = mixChannel(backgroundRgb.r, foregroundRgb.r, foregroundAmount);
      output.data[offset + 1] = mixChannel(backgroundRgb.g, foregroundRgb.g, foregroundAmount);
      output.data[offset + 2] = mixChannel(backgroundRgb.b, foregroundRgb.b, foregroundAmount);
      continue;
    }

    if (backgroundAmount > 0) {
      const originalLightness = (Math.max(original.r, original.g, original.b)
        + Math.min(original.r, original.g, original.b)) / 510;
      const lightnessShift = (
        originalLightness - prepared.backgroundReferenceLightness
      ) * 0.32;
      const backgroundRgb = hslToRgb({
        h: backgroundTargetHsl.h,
        s: backgroundTargetHsl.s,
        l: clamp(backgroundTargetHsl.l + lightnessShift),
      });
      output.data[offset] = mixChannel(original.r, backgroundRgb.r, backgroundAmount);
      output.data[offset + 1] = mixChannel(original.g, backgroundRgb.g, backgroundAmount);
      output.data[offset + 2] = mixChannel(original.b, backgroundRgb.b, backgroundAmount);
    }

    const shirtAmount = (prepared.shirtMask[maskIndex] / 255) * (1 - backgroundAmount);
    if (shirtAmount > 0) {
      const originalHsl = rgbToHsl(original);
      const lightnessDelta = originalHsl.l - prepared.shirtReferenceLightness;
      const recolored = hslToRgb({
        h: shirtTarget.h,
        s: clamp(shirtTarget.s * 0.9 + originalHsl.s * 0.1),
        l: clamp(shirtTarget.l + lightnessDelta * 0.92),
      });
      output.data[offset] = mixChannel(output.data[offset], recolored.r, shirtAmount);
      output.data[offset + 1] = mixChannel(output.data[offset + 1], recolored.g, shirtAmount);
      output.data[offset + 2] = mixChannel(output.data[offset + 2], recolored.b, shirtAmount);
    }
  }

  context.putImageData(output, 0, 0);
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: "png" | "webp") {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Could not create the export file.")),
      format === "png" ? "image/png" : "image/webp",
      0.94,
    );
  });
}
