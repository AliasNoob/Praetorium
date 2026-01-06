const fs = require('fs').promises;
const path = require('path');
const { colorizeSvg, optimizeSvg, isValidSvg } = require('../../utils/svgColorizer');

const ICONS_DIR = path.join(__dirname, '../../data/fetched-icons');

/**
 * Ensure the fetched-icons directory exists
 */
const ensureIconsDir = async () => {
  try {
    await fs.access(ICONS_DIR);
  } catch {
    await fs.mkdir(ICONS_DIR, { recursive: true });
  }
};

/**
 * Generate white, black, and original variants of an icon
 * @param {string} domainSlug - Domain name slug for filename
 * @param {string} svg - SVG content
 * @param {Buffer} originalBuffer - Original image buffer (for PNG fallback)
 * @param {boolean} isTraced - Whether the SVG was traced from bitmap
 * @returns {Promise<{white: string, black: string, original: string}>}
 */
const generateVariants = async (domainSlug, svg, originalBuffer, isTraced) => {
  await ensureIconsDir();

  const timestamp = Date.now();
  const baseFilename = `${timestamp}--${domainSlug}`;
  
  const result = {
    white: null,
    black: null,
    original: null
  };

  // Generate white variant
  if (isValidSvg(svg)) {
    try {
      const whiteSvg = colorizeSvg(svg, 'white');
      const whiteFilename = `${baseFilename}-white.svg`;
      await fs.writeFile(path.join(ICONS_DIR, whiteFilename), whiteSvg);
      result.white = whiteFilename;
    } catch (err) {
      console.error('Failed to generate white variant:', err.message);
    }
  }

  // Generate black variant
  if (isValidSvg(svg)) {
    try {
      const blackSvg = colorizeSvg(svg, 'black');
      const blackFilename = `${baseFilename}-black.svg`;
      await fs.writeFile(path.join(ICONS_DIR, blackFilename), blackSvg);
      result.black = blackFilename;
    } catch (err) {
      console.error('Failed to generate black variant:', err.message);
    }
  }

  // Save original - either optimized SVG or PNG
  if (isTraced && originalBuffer) {
    // Save original as PNG since it was traced
    const originalFilename = `${baseFilename}-original.png`;
    await fs.writeFile(path.join(ICONS_DIR, originalFilename), originalBuffer);
    result.original = originalFilename;
  } else if (isValidSvg(svg)) {
    // Save original SVG (optimized)
    try {
      const optimizedSvg = optimizeSvg(svg);
      const originalFilename = `${baseFilename}-original.svg`;
      await fs.writeFile(path.join(ICONS_DIR, originalFilename), optimizedSvg);
      result.original = originalFilename;
    } catch (err) {
      // Fallback: save unoptimized
      const originalFilename = `${baseFilename}-original.svg`;
      await fs.writeFile(path.join(ICONS_DIR, originalFilename), svg);
      result.original = originalFilename;
    }
  }

  return result;
};

/**
 * Clean up icon files
 * @param {Object} icons - Icon paths object
 */
const cleanupIcons = async (icons) => {
  for (const filename of Object.values(icons)) {
    if (filename) {
      try {
        await fs.unlink(path.join(ICONS_DIR, filename));
      } catch {
        // Ignore cleanup errors
      }
    }
  }
};

module.exports = {
  generateVariants,
  cleanupIcons,
  ensureIconsDir,
  ICONS_DIR
};
