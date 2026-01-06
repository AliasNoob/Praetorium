const sharp = require('sharp');
const potrace = require('potrace');
const { promisify } = require('util');

const trace = promisify(potrace.trace);

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const isPngBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < PNG_SIGNATURE.length) return false;
  return buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
};

const isIcoBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 6) return false;
  const reserved = buffer.readUInt16LE(0);
  const type = buffer.readUInt16LE(2);
  const count = buffer.readUInt16LE(4);
  return reserved === 0 && type === 1 && count > 0;
};

const decodeIcoDibToRgba = (dibBuffer) => {
  if (!Buffer.isBuffer(dibBuffer) || dibBuffer.length < 40) {
    throw new Error('ICO bitmap data is too small');
  }

  const headerSize = dibBuffer.readUInt32LE(0);
  if (headerSize < 40 || headerSize > dibBuffer.length) {
    throw new Error(`ICO bitmap header size is invalid (${headerSize})`);
  }

  const width = dibBuffer.readInt32LE(4);
  const dibHeight = dibBuffer.readInt32LE(8);
  const bitCount = dibBuffer.readUInt16LE(14);
  const colorsUsed = dibBuffer.readUInt32LE(32);

  const absWidth = Math.abs(width);
  const absDibHeight = Math.abs(dibHeight);
  const height = absDibHeight >= 2 ? Math.floor(absDibHeight / 2) : absDibHeight;

  if (absWidth <= 0 || height <= 0) {
    throw new Error('ICO bitmap has invalid dimensions');
  }

  if (bitCount !== 32 && bitCount !== 24) {
    throw new Error(`Unsupported ICO bitmap bit depth (${bitCount})`);
  }

  let paletteSize = 0;
  if (bitCount <= 8) {
    const paletteCount = colorsUsed || (1 << bitCount);
    paletteSize = paletteCount * 4;
  }

  const xorOffset = headerSize + paletteSize;
  const xorRowSize = Math.floor((bitCount * absWidth + 31) / 32) * 4;
  const xorSize = xorRowSize * height;

  const andOffset = xorOffset + xorSize;
  const andRowSize = Math.floor((absWidth + 31) / 32) * 4;
  const andSize = andRowSize * height;

  if (andOffset > dibBuffer.length) {
    throw new Error('ICO bitmap data is truncated');
  }

  const xorData = dibBuffer.subarray(xorOffset, Math.min(dibBuffer.length, andOffset));
  const andData = dibBuffer.subarray(
    andOffset,
    Math.min(dibBuffer.length, andOffset + andSize)
  );

  const isBottomUp = dibHeight > 0;
  const rgba = Buffer.alloc(absWidth * height * 4);

  for (let y = 0; y < height; y++) {
    const srcRow = isBottomUp ? height - 1 - y : y;
    const xorRowStart = srcRow * xorRowSize;
    const andRowStart = srcRow * andRowSize;

    for (let x = 0; x < absWidth; x++) {
      const dstIndex = (y * absWidth + x) * 4;

      if (bitCount === 32) {
        const srcIndex = xorRowStart + x * 4;
        const b = xorData[srcIndex];
        const g = xorData[srcIndex + 1];
        const r = xorData[srcIndex + 2];
        let a = xorData[srcIndex + 3];

        if (andData.length >= andRowStart + Math.ceil(absWidth / 8)) {
          const byteIndex = andRowStart + Math.floor(x / 8);
          const bit = 7 - (x % 8);
          const transparent = (andData[byteIndex] & (1 << bit)) !== 0;
          if (transparent) a = 0;
        }

        rgba[dstIndex] = r;
        rgba[dstIndex + 1] = g;
        rgba[dstIndex + 2] = b;
        rgba[dstIndex + 3] = a;
      } else {
        const srcIndex = xorRowStart + x * 3;
        const b = xorData[srcIndex];
        const g = xorData[srcIndex + 1];
        const r = xorData[srcIndex + 2];
        let a = 255;

        if (andData.length >= andRowStart + Math.ceil(absWidth / 8)) {
          const byteIndex = andRowStart + Math.floor(x / 8);
          const bit = 7 - (x % 8);
          const transparent = (andData[byteIndex] & (1 << bit)) !== 0;
          if (transparent) a = 0;
        }

        rgba[dstIndex] = r;
        rgba[dstIndex + 1] = g;
        rgba[dstIndex + 2] = b;
        rgba[dstIndex + 3] = a;
      }
    }
  }

  return { data: rgba, width: absWidth, height };
};

const extractBestIcoImage = (icoBuffer) => {
  const count = icoBuffer.readUInt16LE(4);
  let bestEntry = null;

  for (let i = 0; i < count; i++) {
    const entryOffset = 6 + i * 16;
    if (entryOffset + 16 > icoBuffer.length) continue;

    const width = icoBuffer.readUInt8(entryOffset) || 256;
    const height = icoBuffer.readUInt8(entryOffset + 1) || 256;
    const bitCount = icoBuffer.readUInt16LE(entryOffset + 6);
    const bytesInRes = icoBuffer.readUInt32LE(entryOffset + 8);
    const imageOffset = icoBuffer.readUInt32LE(entryOffset + 12);

    if (imageOffset <= 0 || bytesInRes <= 0) continue;
    if (imageOffset + bytesInRes > icoBuffer.length) continue;

    const score = width * height * Math.max(1, bitCount || 1);
    if (!bestEntry || score > bestEntry.score) {
      bestEntry = { width, height, bitCount, bytesInRes, imageOffset, score };
    }
  }

  if (!bestEntry) {
    throw new Error('ICO contains no usable images');
  }

  const imageData = icoBuffer.subarray(
    bestEntry.imageOffset,
    bestEntry.imageOffset + bestEntry.bytesInRes
  );

  if (isPngBuffer(imageData)) {
    return { buffer: imageData, format: 'png', ...bestEntry };
  }

  return { buffer: imageData, format: 'dib', ...bestEntry };
};

/**
 * Process an image buffer into SVG format
 * @param {Buffer} buffer - Image buffer
 * @param {string} contentType - MIME type of the image
 * @returns {Promise<{svg: string, originalBuffer: Buffer, isTraced: boolean}>}
 */
const processToSvg = async (buffer, contentType) => {
  // If already SVG, return as-is
  if (typeof contentType === 'string' && contentType.includes('svg')) {
    return {
      svg: buffer.toString('utf-8'),
      originalBuffer: buffer,
      isTraced: false
    };
  }

  let decodedAs = contentType;
  let pngBuffer;
  let inputBuffer = buffer;

  if (isIcoBuffer(buffer)) {
    try {
      const extracted = extractBestIcoImage(buffer);
      if (extracted.format === 'png') {
        inputBuffer = extracted.buffer;
        decodedAs = 'image/png';
      } else {
        decodedAs = 'image/ico-bmp';
        const decoded = decodeIcoDibToRgba(extracted.buffer);
        pngBuffer = await sharp(decoded.data, {
          raw: {
            width: decoded.width,
            height: decoded.height,
            channels: 4
          }
        })
          .resize(128, 128, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
      }
    } catch (err) {
      throw new Error(`Failed to decode ICO (contentType=${contentType}): ${err.message}`);
    }
  }

  // Convert to PNG first for consistent processing
  if (!pngBuffer) {
    try {
      pngBuffer = await sharp(inputBuffer)
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (err) {
      // If sharp fails (e.g., ICO format issues), try without resize
      try {
        pngBuffer = await sharp(inputBuffer).png().toBuffer();
      } catch (innerErr) {
        throw new Error(`Failed to process image (contentType=${contentType}, decodedAs=${decodedAs}): ${innerErr.message}`);
      }
    }
  }

  // Trace bitmap to SVG using potrace
  try {
    const svg = await trace(pngBuffer, {
      turdSize: 2,
      optTolerance: 0.4,
      color: '#000000',
      threshold: 128
    });

    return {
      svg,
      originalBuffer: pngBuffer,
      isTraced: true
    };
  } catch (err) {
    throw new Error(`Failed to trace image to SVG (contentType=${contentType}, decodedAs=${decodedAs}): ${err.message}`);
  }
};

/**
 * Resize an image buffer
 * @param {Buffer} buffer - Image buffer
 * @param {number} size - Target size (width and height)
 * @returns {Promise<Buffer>}
 */
const resizeImage = async (buffer, size = 64) => {
  return sharp(buffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
};

/**
 * Get image metadata
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>}
 */
const getImageMetadata = async (buffer) => {
  try {
    return await sharp(buffer).metadata();
  } catch {
    return null;
  }
};

module.exports = {
  processToSvg,
  resizeImage,
  getImageMetadata
};
