/**
 * contrast.js — WCAG 2.1 relative luminance & contrast ratio.
 * Used to determine legible text color on swatch cards.
 */

/** @param {number} c 0–255 */
function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** @param {[number,number,number]} rgb */
function luminance([r, g, b]) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG contrast ratio between two RGB colors.
 * @param {[number,number,number]} a
 * @param {[number,number,number]} b
 * @returns {number}  1–21
 */
export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  const lighter = Math.max(la, lb), darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns '#000' or '#fff' — whichever contrasts better against the given swatch.
 * @param {[number,number,number]} rgb
 * @returns {'#000000'|'#ffffff'}
 */
export function legibleTextColor(rgb) {
  const onWhite = contrastRatio(rgb, [255, 255, 255]);
  const onBlack = contrastRatio(rgb, [0, 0, 0]);
  return onBlack > onWhite ? '#000000' : '#ffffff';
}
