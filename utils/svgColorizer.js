const { optimize } = require('svgo');

const SVG_XMLNS = 'http://www.w3.org/2000/svg';

const ensureSvgXmlns = (svgContent) => {
  if (typeof svgContent !== 'string') return svgContent;
  if (/<svg[^>]*\sxmlns=/.test(svgContent)) return svgContent;
  return svgContent.replace(/<svg\b/, `<svg xmlns="${SVG_XMLNS}"`);
};

/**
 * Convert SVG to monochrome (white or black)
 * @param {string} svgContent - SVG content as string
 * @param {string} color - Target color ('white', 'black', or hex)
 * @returns {string} - Modified SVG content
 */
const colorizeSvg = (svgContent, color) => {
  const targetColor = color === 'white' ? '#ffffff' : color === 'black' ? '#000000' : color;
  
  // First optimize the SVG
  const optimized = optimize(svgContent, {
    plugins: [
      'preset-default',
      {
        name: 'removeAttrs',
        params: {
          attrs: ['fill-opacity', 'stroke-opacity']
        }
      }
    ]
  });

  let svg = optimized.data;

  // Replace all fill and stroke colors with target color
  // Handle inline styles
  svg = svg.replace(/fill\s*:\s*[^;}"']+/gi, `fill:${targetColor}`);
  svg = svg.replace(/stroke\s*:\s*[^;}"']+/gi, `stroke:${targetColor}`);
  
  // Handle attributes - replace any color values
  svg = svg.replace(/fill="(?!none)[^"]*"/gi, `fill="${targetColor}"`);
  svg = svg.replace(/stroke="(?!none)[^"]*"/gi, `stroke="${targetColor}"`);
  
  // Handle fill/stroke that might be missing - add default fill to root svg
  if (!svg.includes('fill=') && !svg.includes('fill:')) {
    svg = svg.replace('<svg', `<svg fill="${targetColor}"`);
  }

  // Remove any gradients that won't work in monochrome
  svg = svg.replace(/<linearGradient[^>]*>[\s\S]*?<\/linearGradient>/gi, '');
  svg = svg.replace(/<radialGradient[^>]*>[\s\S]*?<\/radialGradient>/gi, '');
  svg = svg.replace(/url\([^)]*\)/gi, targetColor);

  return ensureSvgXmlns(svg);
};

/**
 * Optimize SVG without color changes
 * @param {string} svgContent - SVG content as string
 * @returns {string} - Optimized SVG content
 */
const optimizeSvg = (svgContent) => {
  const result = optimize(svgContent, {
    plugins: [
      'preset-default',
    ]
  });
  return ensureSvgXmlns(result.data);
};

/**
 * Check if SVG content is valid
 * @param {string} content - Content to check
 * @returns {boolean}
 */
const isValidSvg = (content) => {
  if (typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');
};

module.exports = {
  colorizeSvg,
  optimizeSvg,
  isValidSvg
};
