import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ImageSize {
  width: number;
  height: number;
}

function u16(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] ?? 0) << 8) | (bytes[offset + 1] ?? 0);
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  );
}

/** JPEG or PNG pixel size. Returns null when the bytes are not one of those. */
export function imageSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return { width: u32(bytes, 16), height: u32(bytes, 20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    let marker = bytes[offset + 1] ?? 0;
    while (marker === 0xff && offset + 2 < bytes.length) {
      offset += 1;
      marker = bytes[offset + 1] ?? 0;
    }
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) return null;
    if (offset + 1 >= bytes.length) return null;
    const length = u16(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return null;
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (length < 7) return null;
      return { width: u16(bytes, offset + 5), height: u16(bytes, offset + 3) };
    }
    offset += length;
  }
  return null;
}

/** The slide with the fewest pixels. An earlier slide wins a tie. */
export function smallestSlide(sizes: readonly ImageSize[]): ImageSize {
  const first = sizes[0];
  if (!first) {
    throw new Error("A slideshow needs at least one slide");
  }
  let best = first;
  let bestArea = first.width * first.height;
  for (const size of sizes.slice(1)) {
    const area = size.width * size.height;
    if (area < bestArea) {
      best = size;
      bestArea = area;
    }
  }
  return best;
}

/** `{id}_1.jpg` … `{id}_{count}.jpg`. The menu icon is not included. */
export function slideshowMax(imgDir: string, id: string, count: number): ImageSize {
  const sizes: ImageSize[] = [];
  for (let index = 1; index <= count; index++) {
    const filename = `${id}_${index}.jpg`;
    const path = join(imgDir, filename);
    if (!existsSync(path)) {
      throw new Error(`Missing content/img/${filename}`);
    }
    const bytes = readFileSync(path);
    const size = imageSize(bytes);
    if (!size) {
      throw new Error(`Cannot read the pixel size of content/img/${filename}`);
    }
    sizes.push(size);
  }
  return smallestSlide(sizes);
}

/** First directory that has every slide. A missing directory is skipped. */
export function slideshowMaxFrom(
  dirs: readonly string[],
  id: string,
  count: number,
): ImageSize | null {
  for (const dir of dirs) {
    try {
      return slideshowMax(dir, id, count);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Missing content/img/")) continue;
      throw error;
    }
  }
  return null;
}
