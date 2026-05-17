/**
 * main.js — Entry point. Wires all modules together.
 * Owns app state; delegates everything else to modules.
 */

import { qs, qsa, toast, copyText, show, hide, debounce, renderCode, relativeTime } from './modules/ui.js';
import { extractColors } from './modules/extractor.js';
import { FORMATS } from './modules/exporter.js';
import { legibleTextColor, contrastRatio } from './modules/contrast.js';
import { getRecents, saveRecent, removeRecent } from './modules/storage.js';
import { generateShareCard } from './modules/shareCard.js';

/* ── App State ───────────────────────────────────────────── */
const state = {
  imageDataUrl: null,  // current loaded image data URL
  palette: [],         // [r,g,b][] — extracted colors
  colorCount: 6,
  colorFormat: 'hex',  // 'hex' | 'rgb' | 'hsl'
  activeTab: 'tailwind',
  shareCardUrl: null,
};

/* ── Cached DOM refs ─────────────────────────────────────── */
const dom = {
  dropzone:         qs('#dropzone'),
  fileInput:        qs('#file-input'),
  browseBtn:        qs('#browse-btn'),
  workspace:        qs('#workspace'),
  uploadSection:    qs('.upload-section'),
  previewImg:       qs('#preview-img'),
  resetBtn:         qs('#reset-btn'),
  colorSlider:      qs('#color-count-slider'),
  colorOutput:      qs('#color-count-output'),
  paletteSwatches:  qs('#palette-swatches'),
  paletteSkeleton:  qs('#palette-skeleton'),
  formatBtns:       qsa('.format-btn'),
  tabBtns:          qsa('.tab-btn'),
  copyExportBtn:    qs('#copy-export-btn'),
  generateCardBtn:  qs('#generate-card-btn'),
  shareCardPreview: qs('#share-card-preview'),
  shareCardImg:     qs('#share-card-img'),
  downloadCardBtn:  qs('#download-card-btn'),
  copyCardBtn:      qs('#copy-card-btn'),
  samplesGrid:      qs('#samples-grid'),
  recentsSection:   qs('#recents-section'),
  recentsGrid:      qs('#recents-grid'),
};

/* ── Colour conversion helpers ───────────────────────────── */
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToRgbStr([r, g, b]) { return `rgb(${r}, ${g}, ${b})`; }

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
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

function formatColor(rgb) {
  switch (state.colorFormat) {
    case 'rgb': return rgbToRgbStr(rgb);
    case 'hsl': return rgbToHsl(rgb);
    default:    return rgbToHex(rgb);
  }
}

/* ── File handling ───────────────────────────────────────── */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast('Unsupported format. Please use JPEG, PNG, or WebP.', 'error');
    return false;
  }
  if (file.size > MAX_BYTES) {
    toast('File is too large. Maximum size is 10MB.', 'error');
    return false;
  }
  return true;
}

function readFile(file) {
  if (!validateFile(file)) return;
  const reader = new FileReader();
  reader.onload = (e) => loadImage(e.target.result);
  reader.readAsDataURL(file);
}

function loadImage(dataUrl) {
  state.imageDataUrl = dataUrl;
  dom.previewImg.crossOrigin = 'anonymous';
  dom.previewImg.src = dataUrl;
  hide(dom.uploadSection);
  show(dom.workspace);
  runExtraction();
}

function loadRecent(entry) {
  state.imageDataUrl = entry.thumbnail;
  state.palette      = entry.colors.map(hexToRgb);
  state.colorCount   = entry.colors.length;
  state.shareCardUrl = null;
  dom.colorSlider.value  = state.colorCount;
  dom.colorOutput.value  = state.colorCount;
  dom.previewImg.crossOrigin = 'anonymous';
  dom.previewImg.src = entry.thumbnail;
  hide(dom.uploadSection);
  show(dom.workspace);
  hide(dom.paletteSkeleton);
  hide(dom.shareCardPreview);
  renderSwatches();
  renderExports();
  document.title = `Palet — ${state.palette.length} colors extracted`;
}

/* ── Extraction ──────────────────────────────────────────── */
async function runExtraction() {
  // Show skeleton
  show(dom.paletteSkeleton);
  dom.paletteSwatches.innerHTML = '';

  try {
    const colors = await extractColors(dom.previewImg, state.colorCount);
    state.palette = colors;
    hide(dom.paletteSkeleton);
    renderSwatches();
    renderExports();
    document.title = `Palet — ${state.colorCount} colors extracted`;
    // Persist to recents after successful extraction
    const hexColors = colors.map(rgbToHex);
    await saveRecent(state.imageDataUrl, hexColors);
    renderRecents();
  } catch {
    hide(dom.paletteSkeleton);
    toast("Couldn't extract colors. Try a different image.", 'error');
  }
}

/* ── Swatch rendering ────────────────────────────────────── */
function renderSwatches() {
  dom.paletteSwatches.innerHTML = '';
  for (const rgb of state.palette) {
    const hex          = rgbToHex(rgb);
    const display      = formatColor(rgb);
    const textCol      = legibleTextColor(rgb);
    const wcagRatio    = contrastRatio(rgb, [255, 255, 255]);
    const ratioDisplay = wcagRatio.toFixed(1) + ':1';
    const aaClass      = wcagRatio >= 4.5 ? 'contrast-pass' : 'contrast-fail';

    const card = document.createElement('div');
    card.className = 'swatch-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Color ${display}. Click to copy.`);
    card.innerHTML = `
      <div class="swatch-color" style="background:${hex}"></div>
      <div class="swatch-info">
        <div class="swatch-hex" style="color:${textCol}">${display}</div>
        <div class="swatch-contrast ${aaClass}">${ratioDisplay}</div>
      </div>
    `;

    const copy = () => copyText(display, `${display} copied!`);
    card.addEventListener('click', copy);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); }
    });

    dom.paletteSwatches.appendChild(card);
  }
}

/* ── Export rendering ────────────────────────────────────── */
function renderExports() {
  const isEmpty = !state.palette.length;
  for (const [format, fn] of Object.entries(FORMATS)) {
    const el = qs(`#code-${format} code`) ?? qs(`#code-${format}`);
    if (!el) continue;
    el.innerHTML = isEmpty
      ? '<span class="token-punct">// extract a palette first</span>'
      : renderCode(fn(state.palette), format);
  }
}

/* ── Recents rendering ───────────────────────────────────── */
function renderRecents() {
  const recents = getRecents();
  if (!recents.length) { hide(dom.recentsSection); return; }

  show(dom.recentsSection);
  dom.recentsGrid.innerHTML = '';

  for (const entry of recents) {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Recent palette from ${relativeTime(entry.timestamp)}`);

    const swatchBar = entry.colors.map(c =>
      `<div class="recent-swatch" style="background:${c}"></div>`
    ).join('');

    item.innerHTML = `
      <img class="recent-thumb" src="${entry.thumbnail}" alt="Recent palette thumbnail" loading="lazy" />
      <div class="recent-swatches">${swatchBar}</div>
      <div class="recent-date">${relativeTime(entry.timestamp)}</div>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'recent-remove-btn';
    removeBtn.setAttribute('aria-label', 'Remove this recent palette');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecent(entry.id);
      renderRecents();
    });
    item.appendChild(removeBtn);

    const load = () => loadRecent(entry);
    item.addEventListener('click', load);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); }
    });

    dom.recentsGrid.appendChild(item);
  }
}

/* ── Sample images ───────────────────────────────────────── */
// Using a few color-rich Unsplash photos (free to use)
const SAMPLES = [
  {
    url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
    label: 'Film still'
  },
  {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    label: 'Neon city'
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    label: 'Landscape'
  },
];

function renderSamples() {
  for (const sample of SAMPLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sample-thumb';
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `Try example: ${sample.label}`);
    btn.innerHTML = `<img src="${sample.url}" alt="${sample.label}" loading="lazy" crossorigin="anonymous" />`;
    btn.addEventListener('click', () => {
      // Load via data URL so ColorThief can read canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        loadImage(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = sample.url;
    });
    dom.samplesGrid.appendChild(btn);
  }
}

/* ── Event wiring ────────────────────────────────────────── */
function wireDropzone() {
  // Drag events
  dom.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropzone.classList.add('drag-over');
  });
  dom.dropzone.addEventListener('dragleave', () => {
    dom.dropzone.classList.remove('drag-over');
  });
  dom.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  });

  // Click to open file picker
  dom.dropzone.addEventListener('click', (e) => {
    // Don't double-trigger if browse-btn or file-input directly clicked
    if (e.target === dom.fileInput) return;
    dom.fileInput.click();
  });

  // Keyboard activate
  dom.dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dom.fileInput.click();
    }
  });

  dom.fileInput.addEventListener('change', () => {
    const file = dom.fileInput.files[0];
    if (file) readFile(file);
    dom.fileInput.value = '';
  });
}

function wireControls() {
  // Reset button
  dom.resetBtn.addEventListener('click', () => {
    state.imageDataUrl = null;
    state.palette = [];
    state.shareCardUrl = null;
    dom.previewImg.removeAttribute('src');
    dom.shareCardImg.removeAttribute('src');
    dom.paletteSwatches.innerHTML = '';
    hide(dom.workspace);
    show(dom.uploadSection);
    hide(dom.shareCardPreview);
    document.title = 'Palet — Extract Color Palettes from Film Stills';
  });

  // Color count slider — update display immediately, debounce extraction
  const debouncedExtract = debounce(() => {
    if (state.imageDataUrl) runExtraction();
  }, 300);

  dom.colorSlider.addEventListener('input', () => {
    state.colorCount = Number(dom.colorSlider.value);
    dom.colorOutput.value = state.colorCount;
    debouncedExtract();
  });

  // Format toggle
  for (const btn of dom.formatBtns) {
    btn.addEventListener('click', () => {
      dom.formatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.colorFormat = btn.dataset.format;
      if (state.palette.length) renderSwatches();
    });
  }

  // Export tabs
  for (const btn of dom.tabBtns) {
    btn.addEventListener('click', () => {
      dom.tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      state.activeTab = btn.dataset.tab;

      qsa('.tab-panel').forEach(p => {
        const isActive = p.id === `tab-${state.activeTab}`;
        p.classList.toggle('active', isActive);
        p.hidden = !isActive;
      });
    });
  }

  // Copy export code — textContent strips span tags, giving clean code
  dom.copyExportBtn.addEventListener('click', () => {
    const codeEl = qs(`#code-${state.activeTab} code`) ?? qs(`#code-${state.activeTab}`);
    const text = codeEl?.textContent?.trim();
    if (text) copyText(text, 'Code copied!');
  });
}

function wireShareCard() {
  dom.generateCardBtn.addEventListener('click', async () => {
    if (!state.palette.length) return;
    dom.generateCardBtn.disabled = true;
    dom.generateCardBtn.classList.add('loading');
    dom.generateCardBtn.textContent = 'Generating…';
    try {
      const hexColors = state.palette.map(rgbToHex);
      const dataUrl = await generateShareCard(state.imageDataUrl, hexColors);
      state.shareCardUrl = dataUrl;
      dom.shareCardImg.src = dataUrl;
      show(dom.shareCardPreview);
    } catch {
      toast('Share card failed. Try again.', 'error');
    } finally {
      dom.generateCardBtn.disabled = false;
      dom.generateCardBtn.classList.remove('loading');
      dom.generateCardBtn.textContent = 'Generate Share Card';
    }
  });

  dom.downloadCardBtn.addEventListener('click', () => {
    if (!state.shareCardUrl) return;
    const a = document.createElement('a');
    a.href = state.shareCardUrl;
    a.download = 'palet-card.png';
    a.click();
  });

  dom.copyCardBtn.addEventListener('click', async () => {
    if (!state.shareCardUrl) return;
    try {
      const blob = await (await fetch(state.shareCardUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Image copied to clipboard!', 'success');
    } catch {
      toast("Your browser doesn't support copying images. Download instead.", 'error');
    }
  });
}

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd+V — paste image from clipboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      navigator.clipboard.read().then(items => {
        for (const item of items) {
          const type = item.types.find(t => t.startsWith('image/'));
          if (type) {
            item.getType(type).then(blob => {
              readFile(new File([blob], 'paste.png', { type }));
            });
            break;
          }
        }
      }).catch(() => {}); // Permission denied or no image — silently ignore
    }

    // Ctrl/Cmd+E — copy active export tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && state.palette.length) {
      e.preventDefault();
      const codeEl = qs(`#code-${state.activeTab} code`) ?? qs(`#code-${state.activeTab}`);
      const text = codeEl?.textContent?.trim();
      const tabLabels = { tailwind: 'Tailwind', css: 'CSS', scss: 'SCSS', json: 'JSON' };
      if (text) copyText(text, `${tabLabels[state.activeTab] ?? state.activeTab} copied!`);
    }

    // Esc — reset if workspace visible
    if (e.key === 'Escape' && !dom.workspace.hidden) {
      dom.resetBtn.click();
    }
  });

  // Also handle paste event for Firefox compatibility
  document.addEventListener('paste', (e) => {
    const items = [...(e.clipboardData?.items ?? [])];
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      readFile(imageItem.getAsFile());
    }
  });
}

/* ── Init ────────────────────────────────────────────────── */
function init() {
  renderSamples();
  renderRecents();
  wireDropzone();
  wireControls();
  wireShareCard();
  wireKeyboard();
}

init();
