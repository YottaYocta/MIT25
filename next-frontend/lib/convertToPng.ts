// Converts any image file to a PNG File entirely on the client, with optional downscaling.
// - HEIC/HEIF: uses heic2any (WASM) to decode, then resamples and returns PNG.
// - Other browser-decodable formats (jpeg, png, webp, etc.): resample via canvas -> PNG.
//
// Notes:
// - Keeps things lightweight by loading heic2any only if needed (dynamic import).
// - Uses createImageBitmap when available for faster decode and EXIF orientation.
// - Falls back to HTMLImageElement for older browsers.
// - Returns a new File named with .png and type image/png.
// - You can control size via options.maxDimension to reduce bytes.

export type ConvertOptions = {
  // Largest dimension (width or height) after resample. Defaults to 1280.
  maxDimension?: number;
};

export async function convertToPng(
  inputFile: File,
  options?: ConvertOptions,
): Promise<File> {
  const isHeic =
    /image\/hei[cf]/i.test(inputFile.type) ||
    /\.hei[cf]$/i.test(inputFile.name);

  const maxDimension = Math.max(1, options?.maxDimension ?? 1280);

  // Step 1: Normalize to a raster image source
  let rasterBlob: Blob;

  if (isHeic) {
    // Lazy-load the HEIC decoder only when necessary
    const { default: heic2any } = await import("heic2any");
    // heic2any outputs a Blob; request PNG then proceed to resample
    rasterBlob = (await heic2any({
      blob: inputFile,
      toType: "image/png",
    })) as Blob;
  } else {
    // For jpeg/png/webp/gif/bmp/svg that the browser can decode
    rasterBlob = inputFile;
  }

  // Step 2: Decode into an ImageBitmap or HTMLImageElement
  const bitmap = await decodeToBitmap(rasterBlob);

  // Step 3: Paint to canvas at reduced size and export PNG
  const pngBlob = await drawToCanvasAndExport(bitmap, {
    maxDimension,
    type: "image/png",
  });

  // Step 4: Wrap as a File for easy uploads
  return new File([pngBlob], swapExt(inputFile.name, "png"), {
    type: "image/png",
  });
}

// --- helpers ---

function swapExt(name: string, newExt: string): string {
  const idx = name.lastIndexOf(".");
  const stem = idx > -1 ? name.slice(0, idx) : name;
  return `${stem}.${newExt}`;
}

async function decodeToBitmap(blob: Blob): Promise<ImageBitmap> {
  // Prefer createImageBitmap (fast path, honors EXIF with imageOrientation)
  if ("createImageBitmap" in window) {
    try {
      // imageOrientation: from-image respects EXIF rotation where supported
      // (Some browsers ignore this option; harmless if so.)
      // @ts-expect-error - option may not be in older TS lib
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // fall through to HTMLImageElement
    }
  }

  // Fallback: decode via HTMLImageElement
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    // Convert HTMLImageElement to ImageBitmap if available, else paint directly
    if ("createImageBitmap" in window) {
      try {
        return await createImageBitmap(img);
      } catch {
        // fallback to "fake" bitmap via canvas later
        // We will wrap dimensions in drawToCanvasAndExport
        // by drawing the HTMLImageElement.
        // For type safety, cast and handle in drawer.
        return img as unknown as ImageBitmap;
      }
    }
    return img as unknown as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

type ExportOptions = {
  maxDimension: number;
  type: "image/png";
};

async function drawToCanvasAndExport(
  source: ImageBitmap | HTMLImageElement,
  opts: ExportOptions,
): Promise<Blob> {
  const srcWidth =
    (source as ImageBitmap).width ?? (source as HTMLImageElement).naturalWidth;
  const srcHeight =
    (source as ImageBitmap).height ??
    (source as HTMLImageElement).naturalHeight;

  // Compute scaled dimensions
  const scale = Math.min(1, opts.maxDimension / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  // Use OffscreenCanvas if available (faster on some devices), else regular canvas
  let blob: Blob | null = null;

  if ("OffscreenCanvas" in window) {
    const OffscreenCanvasCtor = (window as unknown as Window & {
      OffscreenCanvas: new (w: number, h: number) => OffscreenCanvas;
    }).OffscreenCanvas;
    const off = new OffscreenCanvasCtor(width, height);
    const ctx = off.getContext("2d")!;
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    blob = await off.convertToBlob({ type: opts.type });
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        opts.type,
      )
    );
  }

  return blob!;
}
