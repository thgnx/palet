/**
 * extractor.js — Image → dominant color array.
 * Uses colorthief's named export API (v2.4+).
 */

import { getPalette } from 'colorthief';

/**
 * Extract dominant colors from an image element.
 * @param {HTMLImageElement} img
 * @param {number} count  3–12
 * @returns {Promise<Array<[number,number,number]>>}  RGB tuples
 */
export async function extractColors(img, count = 6) {
  const run = () => getPalette(img, count);

  if (img.complete && img.naturalWidth > 0) {
    return run();
  }

  return new Promise((resolve, reject) => {
    img.addEventListener('load', async () => {
      try { resolve(await run()); }
      catch (e) { reject(e); }
    }, { once: true });
    img.addEventListener('error', () => reject(new Error('Image failed to load')), { once: true });
  });
}
