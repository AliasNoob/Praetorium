const { fetchFavicon, getDomainSlug } = require('../../utils/iconFetcher');
const { processToSvg } = require('./processSvg');
const { generateVariants } = require('./generateVariants');
const asyncWrapper = require('../../middleware/asyncWrapper');
const ErrorResponse = require('../../utils/ErrorResponse');

// Simple in-memory cache for fetched icons
const iconCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * @desc    Fetch favicon from URL and generate variants
 * @route   POST /api/icons/fetch
 * @access  Private
 */
const fetchFaviconController = asyncWrapper(async (req, res, next) => {
  const { url } = req.body;

  if (!url) {
    return next(new ErrorResponse('URL is required', 400));
  }

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return next(new ErrorResponse('Invalid URL format', 400));
  }

  const domainSlug = getDomainSlug(url);
  
  // Check cache first
  const cached = iconCache.get(domainSlug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({
      success: true,
      cached: true,
      icons: cached.icons
    });
  }

  let source;
  let contentType;
  let byteLength;

  try {
    // Fetch favicon from website
    const fetched = await fetchFavicon(url);
    source = fetched.source;
    contentType = fetched.contentType;
    byteLength = fetched.buffer?.length;
    const { buffer } = fetched;

    // Process to SVG (trace if needed)
    const { svg, originalBuffer, isTraced } = await processToSvg(buffer, contentType);

    // Generate white/black/original variants
    const icons = await generateVariants(domainSlug, svg, originalBuffer, isTraced);

    // Validate that at least one icon was generated
    if (!icons.white && !icons.black && !icons.original) {
      return next(new ErrorResponse('Failed to generate icon variants', 500));
    }

    // Cache the result
    iconCache.set(domainSlug, {
      icons,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      cached: false,
      source,
      isTraced,
      icons
    });

  } catch (err) {
    const meta = [];
    if (url) meta.push(`url=${url}`);
    if (source) meta.push(`source=${source}`);
    if (contentType) meta.push(`contentType=${contentType}`);
    if (typeof byteLength === 'number') meta.push(`bytes=${byteLength}`);
    if (err && err.message) meta.push(`reason=${err.message}`);
    return next(new ErrorResponse(`Failed to fetch/process favicon (${meta.join(', ')})`, 500));
  }
});

/**
 * @desc    Clear icon cache
 * @route   DELETE /api/icons/cache
 * @access  Private
 */
const clearIconCache = asyncWrapper(async (req, res, next) => {
  iconCache.clear();
  
  return res.status(200).json({
    success: true,
    message: 'Icon cache cleared'
  });
});

/**
 * @desc    Get cache stats
 * @route   GET /api/icons/cache
 * @access  Private
 */
const getCacheStats = asyncWrapper(async (req, res, next) => {
  const entries = [];
  
  for (const [domain, data] of iconCache.entries()) {
    entries.push({
      domain,
      age: Date.now() - data.timestamp,
      icons: data.icons
    });
  }

  return res.status(200).json({
    success: true,
    cacheSize: iconCache.size,
    entries
  });
});

module.exports = {
  fetchFaviconController,
  clearIconCache,
  getCacheStats
};
