// Shrinks a photo in the browser before upload (keeps uploads small and fast, and under the 4 MB server limit).
export async function compressImage(file, { maxSide = 1800, quality = 0.85 } = {}) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`"${file.name}" could not be read — please use a JPEG, PNG or WebP photo`);
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // flatten transparent PNGs onto white for JPEG
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error(`"${file.name}" could not be processed`);
  return { blob, width: w, height: h };
}

export const VIDEO_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

// Grabs a still frame from a video file to use as its thumbnail. Resolves null if the browser can't decode it.
export function videoPoster(file, maxSide = 800) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const done = (v) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 8000);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.2, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          clearTimeout(timer);
          done(blob ? { blob, width: video.videoWidth, height: video.videoHeight } : null);
        },
        "image/jpeg",
        0.8
      );
    };
    video.src = url;
  });
}
