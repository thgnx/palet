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
