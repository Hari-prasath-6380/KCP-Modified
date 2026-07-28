/**
 * KCP Organics - Cloudinary Image Migration Script
 * 
 * This script uploads ALL existing product images from local storage
 * to Cloudinary for permanent storage. It updates the product records
 * in MongoDB to use Cloudinary URLs.
 * 
 * Usage: node scripts/migrate-to-cloudinary.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const cloudinaryService = require('../services/cloudinary');

const uploadsDir = path.join(__dirname, '../uploads/products');

async function migrateProducts() {
  console.log('='.repeat(60));
  console.log('☁️  KCP Organics - Cloudinary Image Migration');
  console.log('='.repeat(60));

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MongoDB URI not found in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  // Verify Cloudinary config
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name_here') {
    console.error('❌ Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
    process.exit(1);
  }
  console.log('✅ Cloudinary configured');

  // Get all products
  const allProducts = await Product.find({});
  console.log(`\n📦 Found ${allProducts.length} products total`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let cloudinaryAlready = 0;

  for (const product of allProducts) {
    const imageUrl = product.image;

    // Skip if no image or default image
    if (!imageUrl || imageUrl === 'product.jpg') {
      skipped++;
      continue;
    }

    // Skip if already a Cloudinary URL
    if (cloudinaryService.isCloudinaryUrl(imageUrl)) {
      cloudinaryAlready++;
      continue;
    }

    // Skip if already a full HTTP URL (external image)
    if (imageUrl.startsWith('http')) {
      console.log(`⏭️  Skipping external URL for "${product.name}": ${imageUrl.substring(0, 60)}...`);
      skipped++;
      continue;
    }

    console.log(`\n🔄 Processing "${product.name}" (${product._id})...`);

    try {
      // Extract filename from the stored path
      let filename = imageUrl;
      if (imageUrl.includes('/')) {
        filename = imageUrl.split('/').pop();
      }

      const localPath = path.join(uploadsDir, filename);

      // Check if file exists on disk
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  Local file not found: ${localPath}`);
        // Try the raw filename
        const altPath = path.join(uploadsDir, imageUrl);
        if (fs.existsSync(altPath)) {
          console.log(`   Found at alternate path: ${altPath}`);
          const result = await cloudinaryService.uploadFromPath(altPath, {
            public_id: `product_${product._id}`,
            tags: ['kcp_organics', 'migrated'],
            context: `product=${product.name}|product_id=${product._id}`
          });

          // Update product with Cloudinary URL
          product.image = result.secure_url;
          await product.save();
          migrated++;
          console.log(`✅ Migrated: ${result.secure_url}`);
        } else {
          console.log(`❌ File not found anywhere. Skipping.`);
          failed++;
        }
        continue;
      }

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadFromPath(localPath, {
        public_id: `product_${product._id}`,
        tags: ['kcp_organics', 'migrated'],
        context: `product=${product.name}|product_id=${product._id}`
      });

      // Update product with Cloudinary URL
      product.image = result.secure_url;
      await product.save();
      migrated++;
      console.log(`✅ Migrated: ${result.secure_url}`);
    } catch (err) {
      console.error(`❌ Failed to migrate "${product.name}": ${err.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`📦 Total products:         ${allProducts.length}`);
  console.log(`☁️  Already on Cloudinary:   ${cloudinaryAlready}`);
  console.log(`✅ Successfully migrated:   ${migrated}`);
  console.log(`⏭️  Skipped:                ${skipped}`);
  console.log(`❌ Failed:                 ${failed}`);
  console.log('='.repeat(60));

  await mongoose.disconnect();
  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrateProducts().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});