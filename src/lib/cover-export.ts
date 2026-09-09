import { toJpeg } from "html-to-image";

export interface CoverExportResult {
  /** Raw base64 payload without the data:image/jpeg;base64, prefix (for Spotify API) */
  base64: string;
  /** Full Data URL suitable for browser <img> preview or download */
  dataUrl: string;
  /** Binary size in kilobytes (e.g. 112.4) */
  sizeKb: number;
}

export interface CoverExportOptions {
  /** DOM element ID to snapshot (default: "playlist-cover-art") */
  elementId?: string;
  /** Direct HTMLElement instance if already resolved */
  element?: HTMLElement;
  /** Max acceptable binary size in KB before step-down compression (default: 240, Spotify hard limit is 256) */
  targetMaxKb?: number;
  /** Initial JPEG quality from 0 to 1 (default: 0.82) */
  initialQuality?: number;
}

/**
 * Calculates exact binary payload size from a base64 or dataURL string in bytes
 */
export function getBase64ByteSize(base64OrDataUrl: string): number {
  const pureBase64 = base64OrDataUrl
    .replace(/^data:image\/[a-z]+;base64,/, "")
    .trim();
  const padding = pureBase64.endsWith("==")
    ? 2
    : pureBase64.endsWith("=")
    ? 1
    : 0;
  return Math.floor((pureBase64.length * 3) / 4) - padding;
}

/**
 * Client-Side Base64 JPEG Compression Engine
 * Snapshots the 640x640 playlist cover art component and guarantees the output
 * binary size is strictly under Spotify's 256 KB hard limit (targeting <= 240 KB).
 */
export async function exportPlaylistCover(
  options: CoverExportOptions = {}
): Promise<CoverExportResult> {
  const {
    elementId = "playlist-cover-art",
    element: passedElement,
    targetMaxKb = 240,
    initialQuality = 0.82,
  } = options;

  // 1. Locate DOM element
  const targetElement =
    passedElement ||
    (typeof document !== "undefined" ? document.getElementById(elementId) : null);

  if (!targetElement) {
    throw new Error(
      `[CoverExport] Cover art element not found in DOM with ID: #${elementId}`
    );
  }

  // 2. Ensure web fonts are fully loaded before capturing
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness fallback
    }
  }

  // 3. Compression step-down ladder (starts at initialQuality, descends if payload > targetMaxKb)
  const qualityLadder = [
    initialQuality,
    0.72,
    0.62,
    0.52,
    0.42,
  ].filter((q, index, self) => self.indexOf(q) === index && q <= initialQuality);

  const maxBytes = targetMaxKb * 1024;
  let bestDataUrl = "";
  let bestByteSize = Infinity;

  const renderOptions = {
    width: 640,
    height: 640,
    pixelRatio: 1,
    cacheBust: true,
    style: {
      // Prevent parent scale/transform from distorting snapshot
      transform: "none",
      margin: "0",
    },
  };

  for (let i = 0; i < qualityLadder.length; i++) {
    const quality = qualityLadder[i];
    try {
      const dataUrl = await toJpeg(targetElement, {
        ...renderOptions,
        quality,
      });

      const byteSize = getBase64ByteSize(dataUrl);
      bestDataUrl = dataUrl;
      bestByteSize = byteSize;

      // Check if safely under Spotify constraint
      if (byteSize <= maxBytes) {
        break;
      }
    } catch (err) {
      console.warn(
        `[CoverExport] Failed snapshot pass at quality ${quality}:`,
        err
      );
      if (i === qualityLadder.length - 1 && !bestDataUrl) {
        throw err;
      }
    }
  }

  if (!bestDataUrl) {
    throw new Error("[CoverExport] Failed to generate JPEG cover snapshot");
  }

  const rawBase64 = bestDataUrl
    .replace(/^data:image\/[a-z]+;base64,/, "")
    .trim();
  const finalSizeKb = Number((bestByteSize / 1024).toFixed(2));

  return {
    base64: rawBase64,
    dataUrl: bestDataUrl,
    sizeKb: finalSizeKb,
  };
}

/**
 * Triggers a direct browser download of the generated cover JPEG
 */
export function downloadCoverImage(
  dataUrl: string,
  filename = "stagepass-playlist-cover.jpg"
): void {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
