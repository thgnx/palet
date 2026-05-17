# Palet

Extract dominant color palettes from film stills, photos, and design references. Export to Tailwind, CSS variables, SCSS, or JSON. Generate shareable cards.

**→ [palet.tahagenc.com](https://palet.tahagenc.com)**

---

## What it does

Drop an image, get a palette. That's it. But the output is actually useful:

- **4 export formats** — Tailwind config, CSS custom properties, SCSS variables, JSON
- **Shareable cards** — 1200×630 PNG with your image + palette, ready for Twitter/X
- **Recent history** — last 5 palettes stored locally, one click to reload
- **Keyboard first** — paste with `Ctrl+V`, reset with `Esc`, copy swatches with `Enter`

## Why I built this

I kept screenshotting film stills to steal colors for projects. Coolors is too playful. Adobe Color is too enterprise. I wanted something that felt like it belonged next to a Letterboxd review — dark, cinematic, no noise.

So I built Palet.

## Tech

- **Vanilla JS + Vite** — no framework, ~235kB bundle
- **colorthief** — median-cut palette extraction
- **html2canvas** — share card generation
- **No backend, no accounts, no tracking**

All processing happens in your browser.

## Run locally

```bash
git clone https://github.com/tahagenc/palet
cd palet
npm install
npm run dev
```

## License

MIT © [Taha Genç](https://tahagenc.com)
