import { toPng } from "html-to-image";

/**
 * Renders a DOM node to a high-resolution PNG. The share card is laid out at a
 * fixed 1080×1920 (9:16) so exports are crisp on every platform.
 */
const EXPORT_OPTS = {
  cacheBust: true,
  pixelRatio: 1, // node is already authored at full 1080×1920
  backgroundColor: "#08090B",
};

async function nodeToPngBlob(node: HTMLElement): Promise<Blob> {
  // Two passes — the first warms font/image loading so glyphs render reliably.
  await toPng(node, EXPORT_OPTS);
  const dataUrl = await toPng(node, EXPORT_OPTS);
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function downloadCard(node: HTMLElement, fileName: string) {
  const blob = await nodeToPngBlob(node);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyCard(node: HTMLElement): Promise<boolean> {
  try {
    const blob = await nodeToPngBlob(node);
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Web Share API with a file payload (iMessage / Stories / Snapchat handoff). */
export async function shareCard(node: HTMLElement, fileName: string): Promise<boolean> {
  try {
    const blob = await nodeToPngBlob(node);
    const file = new File([blob], fileName, { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        files: [file],
        title: "Today's Picks",
        text: "My Daily Slate card. Pick winners. Beat your friends.",
      });
      return true;
    }
    // Fallback: hand back a download if native share is unavailable.
    await downloadCard(node, fileName);
    return true;
  } catch {
    return false;
  }
}
