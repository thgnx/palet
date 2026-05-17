/**
 * extractor.js — Image → dominant color array.
 * Uses the ColorThief class (default export).
 */

import ColorThief from 'colorthief';

const colorThief = new ColorThief();

/**
 * Extract dominant colors from an image element.
 * @param {HTMLImageElement} img
 * @param {number} count  3–12
 * @returns {Promise<Array<[number,number,number]>>}  RGB tuples
 */
export async function extractColors(img, count = 6) {
  if (img.complete && img.naturalWidth > 0) {
    return colorThief.getPalette(img, count);
  }

  return new Promise((resolve, reject) => {
    img.addEventListener('load', () => {
      try { resolve(colorThief.getPalette(img, count)); }
      catch (e) { reject(e); }
    }, { once: true });
    img.addEventListener('error', () => reject(new Error('Image failed to load')), { once: true });
  });
}
