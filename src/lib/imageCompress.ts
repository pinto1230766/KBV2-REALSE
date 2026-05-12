// Image compression helper.
// Resizes to a max dimension and re-encodes as WebP (fallback JPEG)
// to drastically reduce Base64 payloads stored in IndexedDB.
import { logger } from "./logger";

export interface CompressOptions {
  maxDim?: number;     // max width or height in px
  quality?: number;    // 0..1
  mimeType?: string;   // "image/webp" by default
}

const DEFAULTS: Required<CompressOptions> = {
  maxDim: 800,
  quality: 0.82,
  mimeType: "image/webp",
};

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/**
 * Compress an image File to a downscaled, re-encoded data URL.
 * Returns the original DataURL fallback on failure.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<string> {
  const { maxDim, quality, mimeType } = { ...DEFAULTS, ...opts };
  try {
    const img = await readFileAsImage(file);
    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d ctx");
    ctx.drawImage(img, 0, 0, w, h);
    // Try WebP; if not supported, fallback to JPEG.
    let dataUrl = canvas.toDataURL(mimeType, quality);
    if (!dataUrl.startsWith(`data:${mimeType}`)) {
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    return dataUrl;
  } catch (e) {
    logger.warn("compressImage failed, fallback to raw read:", e);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
