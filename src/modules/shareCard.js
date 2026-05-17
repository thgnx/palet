/**
 * shareCard.js — Generate a shareable 1200x630 PNG card via html2canvas.
 * Renders an off-screen div, captures it, returns a data URL.
 * Uses only system/web-safe fonts — html2canvas cannot load Google Fonts.
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
      scale:  2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f0e0c',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } finally {
    card.remove();
  }
}

function buildCardElement(imageDataUrl, colors) {
  // Dynamic row sizing so all colors fit without clipping
  const availableHeight = 630 - 40 - 40 - 40; // paddingTop + paddingBottom + title area
  const rowHeight  = Math.max(36, Math.floor(availableHeight / colors.length));
  const swatchSize = Math.min(rowHeight - 8, 40);

  const card = document.createElement('div');
  Object.assign(card.style, {
    position:   'fixed',
    left:       '-9999px',
    top:        '0',
    width:      '1200px',
    height:     '630px',
    background: '#0f0e0c',
    display:    'flex',
    overflow:   'hidden',
  });

  // Left: image panel (58%)
  const imgWrap = document.createElement('div');
  Object.assign(imgWrap.style, {
    width:      '58%',
    height:     '100%',
    overflow:   'hidden',
    position:   'relative',
    flexShrink: '0',
  });
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous';
  img.src = imageDataUrl;
  Object.assign(img.style, {
    width:     '100%',
    height:    '100%',
    objectFit: 'cover',
    display:   'block',
  });
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  // Vertical divider
  const divider = document.createElement('div');
  Object.assign(divider.style, {
    width:      '1px',
    height:     '100%',
    background: '#2a2620',
    flexShrink: '0',
  });
  card.appendChild(divider);

  // Right: palette panel (42%)
  const palettePanel = document.createElement('div');
  Object.assign(palettePanel.style, {
    flex:          '1',
    display:       'flex',
    flexDirection: 'column',
    padding:       '40px 36px',
    gap:           '0',
    background:    '#0f0e0c',
    position:      'relative',
    overflow:      'hidden',
  });

  // Title
  const title = document.createElement('div');
  title.textContent = 'COLOR PALETTE';
  Object.assign(title.style, {
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '13px',
    fontWeight:    '400',
    color:         '#5c5547',
    letterSpacing: '0.12em',
    marginBottom:  '20px',
    flexShrink:    '0',
  });
  palettePanel.appendChild(title);

  // Swatches
  const swatchWrap = document.createElement('div');
  Object.assign(swatchWrap.style, {
    display:       'flex',
    flexDirection: 'column',
    flex:          '1',
    overflow:      'hidden',
  });

  colors.forEach((hex, i) => {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display:    'flex',
      alignItems: 'center',
      gap:        '12px',
      height:     `${rowHeight}px`,
      flexShrink: '0',
    });

    const swatch = document.createElement('div');
    Object.assign(swatch.style, {
      width:        `${swatchSize}px`,
      height:       `${swatchSize}px`,
      borderRadius: '5px',
      background:   hex,
      flexShrink:   '0',
    });

    const textBlock = document.createElement('div');
    Object.assign(textBlock.style, {
      display:       'flex',
      flexDirection: 'column',
    });

    const hexLabel = document.createElement('span');
    hexLabel.textContent = hex.toUpperCase();
    Object.assign(hexLabel.style, {
      fontFamily:    'Courier New, monospace',
      fontSize:      '15px',
      fontWeight:    '500',
      color:         '#e8e3d6',
      letterSpacing: '0.06em',
      display:       'block',
    });

    const indexLabel = document.createElement('span');
    indexLabel.textContent = String(i + 1).padStart(2, '0');
    Object.assign(indexLabel.style, {
      fontFamily:    'Courier New, monospace',
      fontSize:      '10px',
      color:         '#5c5547',
      letterSpacing: '0.04em',
      marginTop:     '1px',
      display:       'block',
    });

    textBlock.appendChild(hexLabel);
    textBlock.appendChild(indexLabel);
    row.appendChild(swatch);
    row.appendChild(textBlock);
    swatchWrap.appendChild(row);
  });
  palettePanel.appendChild(swatchWrap);

  // Watermark — bottom right
  const watermark = document.createElement('div');
  watermark.textContent = 'palet.tahagenc.com';
  Object.assign(watermark.style, {
    position:      'absolute',
    bottom:        '28px',
    right:         '36px',
    fontFamily:    'system-ui, sans-serif',
    fontSize:      '11px',
    color:         '#3a3630',
    letterSpacing: '0.06em',
  });
  palettePanel.appendChild(watermark);

  card.appendChild(palettePanel);
  return card;
}
