const { fetchFaviconController, clearIconCache, getCacheStats } = require('./fetchFavicon');
const { processToSvg } = require('./processSvg');
const { generateVariants, cleanupIcons, ICONS_DIR } = require('./generateVariants');

module.exports = {
  fetchFaviconController,
  clearIconCache,
  getCacheStats,
  processToSvg,
  generateVariants,
  cleanupIcons,
  ICONS_DIR
};
