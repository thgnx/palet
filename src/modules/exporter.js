/**
 * exporter.js — Convert RGB palette to developer-ready format strings.
 * Each function is pure: [r,g,b][] → string.
 */

/** @param {[number,number,number]} rgb */
function toHex([r, g, b]) {
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}

/** @param {[number,number,number]} rgb */
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/**
 * @param {Array<[number,number,number]>} palette
 * @returns {string}
 */
export function toTailwind(palette) {
  const entries = palette.map((rgb, i) =>
    `      'palet-${i + 1}': '${toHex(rgb)}',`
  ).join('\n');
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      },\n    },\n  },\n};`;
}

export function toCssVars(palette) {
  const vars = palette.map((rgb, i) =>
    `  --color-palet-${i + 1}: ${toHex(rgb)};`
  ).join('\n');
  return `:root {\n${vars}\n}`;
}

export function toScss(palette) {
  const vars = palette.map((rgb, i) =>
    `$color-palet-${i + 1}: ${toHex(rgb)};`
  ).join('\n');
  return vars;
}

export function toJson(palette) {
  const obj = Object.fromEntries(
    palette.map((rgb, i) => [`palet-${i + 1}`, toHex(rgb)])
  );
  return JSON.stringify(obj, null, 2);
}

/** All formats keyed by tab id */
export const FORMATS = {
  tailwind: toTailwind,
  css:      toCssVars,
  scss:     toScss,
  json:     toJson,
};
