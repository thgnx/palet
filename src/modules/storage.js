/**
 * storage.js — localStorage helper for recent palettes.
 * Stores up to MAX_RECENTS entries; oldest entry is evicted first.
 * Thumbnails are downscaled to 120×80 JPEG before storage.
 */

const KEY = 'palet_recents';
const MAX_RECENTS = 5;

/** @typedef {{ id: string, timestamp: number, thumbnail: string, colors: string[] }} RecentEntry */

/** @returns {RecentEntry[]} */
export function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

/**
 * Downscale a data URL to a 120×80 cover-cropped JPEG thumbnail.
 * @param {string} dataUrl
 * @returns {Promise<string>}
 */
function downscaleThumbnail(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const TW = 120, TH = 80;
      const scale = Math.max(TW / img.naturalWidth, TH / img.naturalHeight);
      const sw = TW / scale, sh = TH / scale;
      const sx = (img.naturalWidth  - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      const canvas = document.createElement('canvas');
      canvas.width  = TW;
      canvas.height = TH;
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, TW, TH);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original on error
    img.src = dataUrl;
  });
}

/**
 * Save a palette to recents. Downscales thumbnail before writing.
 * @param {string} thumbnail  base64 data URL (full size)
 * @param {string[]} colors   hex strings
 * @returns {Promise<RecentEntry[]>}
 */
export async function saveRecent(thumbnail, colors) {
  const downsized = await downscaleThumbnail(thumbnail);
  const recents = getRecents();
  const entry = {
    id: Date.now().toString(36),
    timestamp: Date.now(),
    thumbnail: downsized,
    colors,
  };
  const updated = [entry, ...recents].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // Storage quota exceeded — silently fail
  }
  return updated;
}

/** @param {string} id */
export function removeRecent(id) {
  const updated = getRecents().filter(r => r.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}
