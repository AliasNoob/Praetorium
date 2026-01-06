const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Fetches favicon from a website using multiple strategies
 * @param {string} url - The website URL
 * @returns {Promise<{buffer: Buffer, contentType: string, source: string}>}
 */
const fetchFavicon = async (url) => {
  const parsedUrl = new URL(url);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  
  // Strategy 1: Parse HTML for favicon links
  try {
    const faviconFromHtml = await fetchFaviconFromHtml(baseUrl);
    if (faviconFromHtml) {
      return { ...faviconFromHtml, source: 'html' };
    }
  } catch (err) {
    // Continue to next strategy
  }

  // Strategy 2: Try /favicon.ico directly
  try {
    const faviconFromRoot = await fetchFaviconFromPath(`${baseUrl}/favicon.ico`);
    if (faviconFromRoot) {
      return { ...faviconFromRoot, source: 'root' };
    }
  } catch (err) {
    // Continue to next strategy
  }

  // Strategy 3: Google Favicon API
  try {
    const googleFavicon = await fetchFromGoogleApi(parsedUrl.hostname);
    if (googleFavicon) {
      return { ...googleFavicon, source: 'google' };
    }
  } catch (err) {
    // Continue to next strategy
  }

  // Strategy 4: DuckDuckGo Favicon API
  try {
    const duckFavicon = await fetchFromDuckDuckGo(parsedUrl.hostname);
    if (duckFavicon) {
      return { ...duckFavicon, source: 'duckduckgo' };
    }
  } catch (err) {
    // All strategies failed
  }

  throw new Error(`Could not fetch favicon for ${url}`);
};

/**
 * Parse HTML page to find favicon link tags
 */
const fetchFaviconFromHtml = async (baseUrl) => {
  const response = await axios.get(baseUrl, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  
  // Look for various favicon link types in order of preference
  const selectors = [
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel="icon"][sizes="192x192"]',
    'link[rel="icon"][sizes="128x128"]',
    'link[rel="icon"][sizes="96x96"]',
    'link[rel="icon"][sizes="64x64"]',
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="icon"]',
    'link[rel="shortcut icon"]'
  ];

  for (const selector of selectors) {
    const link = $(selector).first();
    if (link.length) {
      let href = link.attr('href');
      if (href) {
        // Handle relative URLs
        if (href.startsWith('//')) {
          href = 'https:' + href;
        } else if (href.startsWith('/')) {
          href = baseUrl + href;
        } else if (!href.startsWith('http')) {
          href = baseUrl + '/' + href;
        }
        
        return await fetchFaviconFromPath(href);
      }
    }
  }

  return null;
};

/**
 * Fetch favicon from a direct URL path
 */
const fetchFaviconFromPath = async (faviconUrl) => {
  const response = await axios.get(faviconUrl, {
    responseType: 'arraybuffer',
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const contentType = response.headers['content-type'] || 'image/x-icon';
  
  // Validate it's actually an image
  if (!contentType.includes('image') && !contentType.includes('svg') && !contentType.includes('icon')) {
    return null;
  }

  return {
    buffer: Buffer.from(response.data),
    contentType
  };
};

/**
 * Fetch from Google's Favicon service
 */
const fetchFromGoogleApi = async (domain) => {
  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  
  const response = await axios.get(googleUrl, {
    responseType: 'arraybuffer',
    timeout: 10000
  });

  return {
    buffer: Buffer.from(response.data),
    contentType: response.headers['content-type'] || 'image/png'
  };
};

/**
 * Fetch from DuckDuckGo's Favicon service
 */
const fetchFromDuckDuckGo = async (domain) => {
  const duckUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  
  const response = await axios.get(duckUrl, {
    responseType: 'arraybuffer',
    timeout: 10000
  });

  return {
    buffer: Buffer.from(response.data),
    contentType: response.headers['content-type'] || 'image/x-icon'
  };
};

/**
 * Extract domain name for file naming
 */
const getDomainSlug = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/\./g, '-');
  } catch {
    return 'unknown';
  }
};

module.exports = {
  fetchFavicon,
  getDomainSlug
};
