/**
 * shareCard.js — Generate a shareable 1200x630 PNG card via html2canvas.
 * Renders an off-screen div, captures it, returns a data URL.
 */

import html2canvas from 'html2canvas';

/**
 * @param {string} imageDataUrl  The preview image data URL
 * @param {string[]} hexColors   Array of hex color strings
 * @returns {Promise<string>}    PNG data URL
 */
export async function generateShareCard(imageDataUrl, hexColors) {
  const card = buildCardElement(imageDataUrl, hexColors);
  document.body.appendChild(card);

  try {
    const canvas = await html2canvas(card, {
      width:  1200,
      height: 630,
      scale:  1,
      useCORS: true,
      backgroundColor: '#0f0e0c',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } finally {
    card.remove();
  }
}

function buildCardElement(imageDataUrl, colors) {
  const card = document.createElement('div');
  Object.assign(card.style, {
    position:   'fixed',
    left:       '-9999px',
    top:        '0',
    width:      '1200px',
    height:     '630px',
    background: '#0f0e0c',
    display:    'flex',
    fontFamily: 'Geist, system-ui, sans-serif',
    overflow:   'hidden',
  });

  // Left: image panel (55% width)
  const imgWrap = document.createElement('div');
  Object.assign(imgWrap.style, {
    width:    '55%',
    height:   '100%',
    overflow: 'hidden',
    position: 'relative',
  });
  const img = document.createElement('img');
  img.src = imageDataUrl;
  Object.assign(img.style, {
    width:     '100%',
    height:    '100%',
    objectFit: 'cover',
  });
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  // Right: palette panel
  const palettePanel = document.createElement('div');
  Object.assign(palettePanel.style, {
    flex:           '1',
    display:        'flex',
    flexDirection:  'column',
    padding:        '48px 40px',
    gap:            '24px',
    background:     '#0f0e0c',
    position:       'relative',
  });

  // Title
  const title = document.createElement('div');
  title.textContent = 'Color Palette';
  Object.assign(title.style, {
    fontFamily:    'Fraunces, Georgia, serif',
    fontSize:      '20px',
    fontWeight:    '300',
    fontStyle:     'italic',
    color:         '#9a9180',
    letterSpacing: '0.02em',
  });
  palettePanel.appendChild(title);

  // Swatches
  const swatchWrap = document.createElement('div');
  Object.assign(swatchWrap.style, {
    display:        'flex',
    flexDirection:  'column',
    gap:            '10px',
    flex:           '1',
  });

  for (const hex of colors) {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display:      'flex',
      alignItems:   'center',
      gap:          '14px',
    });
    const swatch = document.createElement('div');
    Object.assign(swatch.style, {
      width:        '40px',
      height:       '40px',
      borderRadius: '6px',
      background:   hex,
      flexShrink:   '0',
    });
    const hexLabel = document.createElement('span');
    hexLabel.textContent = hex.toUpperCase();
    Object.assign(hexLabel.style, {
      fontFamily:    'Geist Mono, monospace',
      fontSize:      '15px',
      fontWeight:    '400',
      color:         '#e8e3d6',
      letterSpacing: '0.06em',
    });
    row.appendChild(swatch);
    row.appendChild(hexLabel);
    swatchWrap.appendChild(row);
  }
  palettePanel.appendChild(swatchWrap);

  // Watermark
  const watermark = document.createElement('div');
  watermark.textContent = 'palet.tahagenc.com';
  Object.assign(watermark.style, {
    position:      'absolute',
    bottom:        '28px',
    right:         '40px',
    fontFamily:    'Geist, system-ui, sans-serif',
    fontSize:      '12px',
    color:         '#5c5547',
    letterSpacing: '0.04em',
  });
  palettePanel.appendChild(watermark);

  card.appendChild(palettePanel);
  return card;
}
