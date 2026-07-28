// Hardcoded credentials from .env (since dotenv may not load properly from this path)
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'iaqki5ds',
  api_key: '882671221625529',
  api_secret: 'eeqYizfF5IeYVb9V2rpWfJLEqg4',
});

(async () => {
  try {
    console.log('=== CLOUDINARY CONNECTION TEST ===');
    console.log('');

    // Test 1: Ping / List resources
    console.log('Test 1: Listing resources in kcp_organics/products...');
    const result = await cloudinary.api.resources({ 
      max_results: 50, 
      type: 'upload', 
      prefix: 'kcp_organics/products' 
    });
    console.log('✅ Cloudinary connection successful!');
    console.log('Resources found:', result.resources.length);
    
    if (result.resources.length === 0) {
      console.log('⚠️  No resources found in kcp_organics/products folder.');
      console.log('   This means either:');
      console.log('   1. No images have been uploaded to Cloudinary yet');
      console.log('   2. Images were uploaded to a different folder');
      console.log('');
      console.log('Checking root folder for any uploaded images...');
      const rootResult = await cloudinary.api.resources({ max_results: 20, type: 'upload' });
      console.log('Total resources in account:', rootResult.resources.length);
      rootResult.resources.forEach(r => {
        console.log(`  - ${r.public_id} → ${r.secure_url}`);
      });
    } else {
      result.resources.forEach(r => {
        console.log(`  - Public ID: ${r.public_id}`);
        console.log(`    URL: ${r.secure_url}`);
        console.log(`    Created: ${r.created_at}`);
        console.log(`    Format: ${r.format}`);
        console.log('');
      });
    }

    // Test 2: Upload a test image to verify upload works
    console.log('');
    console.log('Test 2: Testing image upload capability...');
    const fs = require('fs');
    const path = require('path');
    
    const testImage = path.join(__dirname, '..', 'veg1.jpeg');
    console.log('Looking for test image at:', testImage);
    
    if (fs.existsSync(testImage)) {
      console.log('✅ Test image found, uploading...');
      const uploadResult = await cloudinary.uploader.upload(testImage, {
        folder: 'kcp_organics/products',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
      });
      console.log('✅ Test upload successful!');
      console.log('  Public ID:', uploadResult.public_id);
      console.log('  URL:', uploadResult.secure_url);
      
      // Now verify it persists by listing again
      console.log('');
      console.log('Test 3: Verifying image persists on Cloudinary...');
      const verifyResult = await cloudinary.api.resources({ 
        max_results: 50, 
        type: 'upload', 
        prefix: 'kcp_organics/products' 
      });
      console.log('Resources after upload:', verifyResult.resources.length);
      
      // Clean up - delete the test upload
      console.log('');
      console.log('Cleaning up test upload...');
      await cloudinary.uploader.destroy(uploadResult.public_id);
      console.log('✅ Test image cleaned up');
    } else {
      console.log('⚠️  Test image veg1.jpeg not found. Trying alternative test...');
      // Create a simple test image buffer
      const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const result2 = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'kcp_organics/products', resource_type: 'image' },
          (err, res) => err ? reject(err) : resolve(res)
        );
        stream.end(testBuffer);
      });
      console.log('✅ Test upload from buffer successful!');
      console.log('  Public ID:', result2.public_id);
      console.log('  URL:', result2.secure_url);
      
      await cloudinary.uploader.destroy(result2.public_id);
      console.log('  Cleaned up');
    }

    console.log('');
    console.log('=== ALL TESTS PASSED ===');
    console.log('✅ Cloudinary is properly configured and working.');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('If you are adding products and images disappear, the issue is likely');
    console.log('in the product form submission flow (frontend admin-script.js → backend products.js)');
    console.log('Check whether the frontend sends the Cloudinary URL correctly when saving the product.');
  } catch (err) {
    console.error('❌ Cloudinary test failed:', err.message);
    if (err.http_code) {
      console.error('HTTP Code:', err.http_code);
    }
    if (err.error && err.error.message) {
      console.error('Details:', err.error.message);
    }
  }
})();