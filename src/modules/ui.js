/**
 * ui.js — DOM helpers, toast notifications, and UI feedback utilities.
 * All functions are pure side-effect helpers; no state held here.
 */

/** @param {string} sel @param {Element|Document} ctx */
export const qs  = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Create element with optional attributes and children.
 * @param {string} tag
 * @param {Record<string,string>} [attrs]
 * @param {(string|Element)[]} [children]
 */
export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else el.setAttribute(k, v);
  }
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

let _toastTimer = null;

/**
 * Show a transient toast message.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type]
 * @param {number} [duration] ms
 */
export function toast(message, type = 'info', duration = 2400) {
  const container = qs('#toast-container');
  const el = createEl('div', { class: `toast ${type}` }, [message]);
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast-exit');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}

/**
 * Copy text to clipboard, show toast feedback.
 * @param {string} text
 * @param {string} [successMsg]
 */
export async function copyText(text, successMsg = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    toast(successMsg, 'success');
  } catch {
    // Fallback for older browsers / non-HTTPS
    const ta = createEl('textarea', { style: 'position:fixed;opacity:0' }, [text]);
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(successMsg, 'success');
  }
}

/** Show/hide an element using the `hidden` attribute. */
export const show = (el) => { el.hidden = false; };
export const hide = (el) => { el.hidden = true; };

/**
 * Returns a debounced version of fn that only fires after delay ms of silence.
 * @param {Function} fn
 * @param {number} delay  ms
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Human-readable relative timestamp.
 * @param {number} ts  Unix ms timestamp
 * @returns {string}
 */
export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  if (diff < 60_000) return 'just now';
  if (min  < 60)     return `${min}m ago`;
  if (hr   < 24)     return `${hr}h ago`;
  if (day  === 1)    return 'yesterday';
  if (day  < 7)      return `${day} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Minimal syntax highlighter — no library, no dependencies.
 * HTML-escapes text then wraps 3 token types in CSS spans.
 * @param {string} text   raw code string
 * @param {'tailwind'|'css'|'scss'|'json'} format
 * @returns {string}  HTML string safe to set as innerHTML
 */
export function renderCode(text, format) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Hex values → var(--accent)
  html = html.replace(/#[0-9a-fA-F]{6}/g,
    m => `<span class="token-key">${m}</span>`);

  // Property names / keys → var(--text-primary)
  if (format === 'json') {
    html = html.replace(/"([\w-]+)"(?=\s*:)/g,
      (_, k) => `<span class="token-val">"${k}"</span>`);
  } else if (format === 'css') {
    html = html.replace(/(--[\w-]+)/g,
      m => `<span class="token-val">${m}</span>`);
  } else if (format === 'scss') {
    html = html.replace(/(\$[\w-]+)/g,
      m => `<span class="token-val">${m}</span>`);
  } else if (format === 'tailwind') {
    html = html.replace(/'([\w-]+)'/g,
      (_, k) => `<span class="token-val">'${k}'</span>`);
  }

  // Punctuation → var(--text-tertiary)
  html = html.replace(/[{}:;,]/g,
    m => `<span class="token-punct">${m}</span>`);

  return html;
}
