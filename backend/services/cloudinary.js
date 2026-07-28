const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary from a local file path
 * @param {string} filePath - Absolute or relative path to the image file
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
async function uploadFromPath(filePath, options = {}) {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const result = await cloudinary.uploader.upload(resolvedPath, {
      folder: 'kcp_organics/products',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options,
    });

    console.log(`✅ Cloudinary upload success: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw error;
  }
}

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
async function uploadFromBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kcp_organics/products',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary buffer upload error:', error.message);
          reject(error);
        } else {
          console.log(`✅ Cloudinary buffer upload success: ${result.secure_url}`);
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload an image from a URL to Cloudinary
 * @param {string} imageUrl - Public URL of the image
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
async function uploadFromUrl(imageUrl, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'kcp_organics/products',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options,
    });

    console.log(`✅ Cloudinary URL upload success: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary URL upload error:', error.message);
    throw error;
  }
}

/**
 * Upload a base64 encoded image to Cloudinary
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
async function uploadFromBase64(base64Data, options = {}) {
  try {
    // Ensure proper data URI format
    let dataUri = base64Data;
    if (!dataUri.startsWith('data:')) {
      dataUri = `data:image/jpeg;base64,${dataUri}`;
    }

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'kcp_organics/products',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options,
    });

    console.log(`✅ Cloudinary base64 upload success: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary base64 upload error:', error.message);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary by its URL or public ID
 * @param {string} imageIdentifier - Cloudinary URL or public ID
 * @returns {Promise<object>} Cloudinary deletion result
 */
async function deleteImage(imageIdentifier) {
  try {
    // Extract public ID from URL if a full URL is provided
    let publicId = imageIdentifier;
    if (imageIdentifier.includes('cloudinary.com')) {
      // Extract public ID from URL: .../upload/v1234567/folder/public_id.ext
      const matches = imageIdentifier.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
      if (matches && matches[1]) {
        publicId = matches[1];
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Cloudinary delete success: ${publicId}`);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    throw error;
  }
}

/**
 * Check if a URL is a Cloudinary URL
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is from Cloudinary
 */
function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('cloudinary.com');
}

/**
 * Get the optimized Cloudinary URL for an image
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options (width, height, crop, quality, etc.)
 * @returns {string} Optimized Cloudinary URL
 */
function getOptimizedUrl(publicId, options = {}) {
  const { width, height, crop = 'fill', quality = 'auto', fetch_format = 'auto' } = options;
  const transformations = [];

  if (width) transformations.push({ width });
  if (height) transformations.push({ height });
  transformations.push({ crop, quality, fetch_format });

  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
}

/**
 * Extract Cloudinary public ID from a full URL
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} Public ID or null if not a Cloudinary URL
 */
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return matches ? matches[1] : null;
}

module.exports = {
  cloudinary,
  uploadFromPath,
  uploadFromBuffer,
  uploadFromUrl,
  uploadFromBase64,
  deleteImage,
  isCloudinaryUrl,
  getOptimizedUrl,
  extractPublicId,
};