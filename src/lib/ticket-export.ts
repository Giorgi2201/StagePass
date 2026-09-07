import { toPng, toBlob } from "html-to-image";

export interface TicketExportResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  filename: string;
}

export interface ShareTicketOptions {
  file: File;
  dataUrl: string;
  filename: string;
  artistName: string;
  venueName?: string;
  dateStr?: string;
}

/**
 * Renders a DOM element to high-res retina PNG, Blob, and File
 */
export async function generateTicketImage(
  element: HTMLElement,
  artistName: string,
  pixelRatio = 3
): Promise<TicketExportResult> {
  // Wait for web fonts to load to prevent fallback font flash
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness fallback
    }
  }

  const options = {
    pixelRatio,
    cacheBust: true,
    quality: 0.98,
    style: {
      // Ensure element renders without parent CSS scale transforms applied
      transform: "none",
      margin: "0",
    },
  };

  const dataUrl = await toPng(element, options);
  let blob = await toBlob(element, options);

  if (!blob) {
    // Fallback: convert dataURL to Blob if toBlob returns null
    const res = await fetch(dataUrl);
    blob = await res.blob();
  }

  const sanitized =
    artistName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "concert";

  const filename = `stagepass-${sanitized}-ticket.png`;
  const file = new File([blob], filename, { type: "image/png" });

  return {
    dataUrl,
    blob,
    file,
    filename,
  };
}

/**
 * Triggers direct browser file download of the ticket PNG
 */
export function downloadTicketImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies the ticket image PNG directly to the system clipboard
 */
export async function copyTicketToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      return true;
    } catch (err) {
      console.warn("Clipboard copy image not permitted or failed:", err);
      return false;
    }
  }
  return false;
}

/**
 * Native Mobile Web Share API Level 2 (files support) with automatic desktop download fallback
 */
export async function shareTicket(
  options: ShareTicketOptions
): Promise<{ shared: boolean; method: "native" | "download" | "cancelled" }> {
  const { file, dataUrl, filename, artistName, venueName, dateStr } = options;

  const title = `${artistName} Live Concert Ticket - StagePass`;
  const text = `Check out my concert ticket stub and setlist playlist for ${artistName}${
    venueName ? ` at ${venueName}` : ""
  }${dateStr ? ` (${dateStr})` : ""}! Generated with StagePass 🎟️`;

  // 1. Try Native Web Share API Level 2 with files (iOS / Android / Safari / Chrome Mobile)
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return { shared: true, method: "native" };
    } catch (err) {
      // If user aborted / dismissed the share sheet, return cancelled without error
      if (err instanceof Error && err.name === "AbortError") {
        return { shared: false, method: "cancelled" };
      }
      console.warn("Native share failed, falling back to download:", err);
    }
  }

  // 2. Desktop Fallback: Trigger browser file download
  downloadTicketImage(dataUrl, filename);
  return { shared: true, method: "download" };
}
