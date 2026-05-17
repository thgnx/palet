/**
 * storage.js — localStorage helper for recent palettes.
 * Stores up to MAX_RECENTS entries; oldest entry is evicted first.
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
 * Save a palette to recents.
 * @param {string} thumbnail  base64 data URL
 * @param {string[]} colors   hex strings
 */
export function saveRecent(thumbnail, colors) {
  const recents = getRecents();
  const entry = {
    id: Date.now().toString(36),
    timestamp: Date.now(),
    thumbnail,
    colors,
  };
  // Prepend, limit to MAX_RECENTS
  const updated = [entry, ...recents].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // Storage full — drop oldest
    const trimmed = [entry, ...recents].slice(0, MAX_RECENTS - 1);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  }
  return updated;
}

/** @param {string} id */
export function removeRecent(id) {
  const updated = getRecents().filter(r => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
}
