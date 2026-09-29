// SHA-256 Cryptographic Evidence Digest (Native Web Crypto API)
export async function computeSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Client-Side Error Level Analysis (ELA) Engine
export async function generateELACanvas(
  imageElement: HTMLImageElement,
  canvasTarget: HTMLCanvasElement
): Promise<void> {
  const ctx = canvasTarget.getContext("2d");
  if (!ctx) return;

  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;

  canvasTarget.width = width;
  canvasTarget.height = height;

  // Render original image to an offscreen buffer
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;
  offCtx.drawImage(imageElement, 0, 0, width, height);

  // Recompress image to JPEG at 85% quality to expose compression inconsistencies
  const recompressedDataUrl = offscreen.toDataURL("image/jpeg", 0.85);

  const recompressedImg = new Image();
  recompressedImg.src = recompressedDataUrl;

  await new Promise((resolve) => {
    recompressedImg.onload = resolve;
  });

  ctx.drawImage(recompressedImg, 0, 0, width, height);

  // Extract pixel arrays to compute difference matrix
  const origData = offCtx.getImageData(0, 0, width, height);
  const recompressedData = ctx.getImageData(0, 0, width, height);

  const origPixels = origData.data;
  const recompPixels = recompressedData.data;
  const diffImageData = ctx.createImageData(width, height);
  const diffPixels = diffImageData.data;

  // Difference multiplier to visually illuminate edited regions
  const scale = 20;

  for (let i = 0; i < origPixels.length; i += 4) {
    const rDiff = Math.abs(origPixels[i] - recompPixels[i]) * scale;
    const gDiff = Math.abs(origPixels[i + 1] - recompPixels[i + 1]) * scale;
    const bDiff = Math.abs(origPixels[i + 2] - recompPixels[i + 2]) * scale;

    diffPixels[i] = rDiff;
    diffPixels[i + 1] = gDiff;
    diffPixels[i + 2] = bDiff;
    diffPixels[i + 3] = 255;
  }

  // Paint the ELA forensic visualization
  ctx.putImageData(diffImageData, 0, 0);
}
