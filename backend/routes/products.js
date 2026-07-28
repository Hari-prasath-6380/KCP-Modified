const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure temp upload directory exists
const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for temporary file storage (files deleted after Cloudinary upload)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp, bmp, svg) are allowed'));
  }
});

// Get all products for admin dashboard (no pagination, returns all products)
// This must come BEFORE the GET / route
router.get('/admin/all', async (req, res) => {
    try {
        // Include ALL products including inactive ones for admin view
        const { sortBy = 'newest' } = req.query;

        let sortOption = { createdAt: -1 };
        if (sortBy === 'price-asc') sortOption = { price: 1 };
        if (sortBy === 'price-desc') sortOption = { price: -1 };
        if (sortBy === 'rating') sortOption = { averageRating: -1 };
        if (sortBy === 'popular') sortOption = { sales: -1 };

        // Fetch ALL products without pagination for admin
        const products = await Product.find()
            .sort(sortOption);

        const total = await Product.countDocuments();

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                pages: 1
            }
        });
    } catch (error) {
        console.error('Error fetching admin products:', error && error.stack ? error.stack : error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get random products for homepage
router.get('/random', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 8;
        
        // Match only active products (or those without isActive field)
        const products = await Product.aggregate([
            { $match: { $or: [ { isActive: { $exists: false } }, { isActive: true } ] } },
            { $sample: { size: count } }
        ]);
        
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching random products:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all products with pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, name, sortBy = 'newest' } = req.query;
        const skip = (page - 1) * limit;

        // Treat documents without `isActive` field as active (backwards compatibility)
        let query = { $or: [ { isActive: { $exists: false } }, { isActive: true } ] };
        if (category) query.category = category;
        
        // Search by product name (case-insensitive)
        if (name) {
            const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.name = { $regex: new RegExp(escaped, 'i') };
        }

        let sortOption = { createdAt: -1 };
        if (sortBy === 'price-asc') sortOption = { price: 1 };
        if (sortBy === 'price-desc') sortOption = { price: -1 };
        if (sortBy === 'rating') sortOption = { averageRating: -1 };
        if (sortBy === 'popular') sortOption = { sales: -1 };

        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error creating product:', error && error.stack ? error.stack : error);
        if (error && error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// Search products by name for stock check (must come before /:id)
router.get('/stock/by-name', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ success: false, message: 'name query param required' });
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const product = await Product.findOne({ name: { $regex: new RegExp(escaped, 'i') } })
            .select('name stock units');
        if (!product) return res.status(200).json({ success: true, data: null });
        res.status(200).json({
            success: true,
            data: {
                _id: product._id,
                name: product.name,
                stock: product.stock,
                units: (product.units || []).map(u => ({ unit: u.unit, quantity: u.quantity, stock: u.stock }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Invalid Product ID format' });
        }
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Increment views
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Decrement stock (used when user adds to cart)
router.post('/:id/decrement', async (req, res) => {
    try {
        const { quantity = 1, unitIndex = null } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Check if product is active
        if (!product.isActive) {
            return res.status(400).json({ success: false, message: 'Product is not available' });
        }

        if (unitIndex !== null && Array.isArray(product.units) && product.units[unitIndex]) {
            const unit = product.units[unitIndex];
            // Get available stock from unit or fallback to product stock
            const unitStockAvailable = (typeof unit.stock === 'number' && unit.stock > 0) ? unit.stock : null;
            const productStockAvailable = (typeof product.stock === 'number' && product.stock > 0) ? product.stock : 0;
            
            // Determine which stock to use
            const availableStock = unitStockAvailable !== null ? unitStockAvailable : productStockAvailable;
            
            if (availableStock < quantity) {
                const outOfStock = availableStock === 0;
                return res.status(400).json({ 
                    success: false, 
                    message: outOfStock ? 'Product is out of stock' : `Only ${availableStock} unit(s) available`,
                    available: availableStock
                });
            }
            
            // Decrement the stock we used
            if (unitStockAvailable !== null) {
                unit.stock = unit.stock - quantity;
            } else {
                product.stock = product.stock - quantity;
            }
        } else {
            // No unit specified, use base product stock
            const availableStock = (typeof product.stock === 'number') ? product.stock : 0;
            
            if (availableStock < quantity) {
                const outOfStock = availableStock === 0;
                return res.status(400).json({ 
                    success: false, 
                    message: outOfStock ? 'Product is out of stock' : `Only ${availableStock} unit(s) available`,
                    available: availableStock
                });
            }
            
            product.stock = product.stock - quantity;
        }

        product.updatedAt = Date.now();
        await product.save();

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create product (with image upload to Cloudinary)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            shortDescription,
            price,
            originalPrice,
            discount,
            cost,
            stock,
            sku,
            images,
            category,
            subCategory,
            tags,
            variants,
            attributes,
            units,
            metaTitle,
            metaDescription,
            metaKeywords,
            isFeatured,
            isActive
        } = req.body;

        if (!name || !description) {
            return res.status(400).json({ success: false, message: 'Required fields missing: name and description are required' });
        }
        
        // Ensure price is a valid number
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice <= 0) {
            return res.status(400).json({ success: false, message: 'Price must be a valid number greater than 0' });
        }

        // Ensure category and description defaults
        const safeCategory = category || 'Uncategorized';
        const safeDescription = description || name;

        // Sanitize tags and images
        const safeTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : (typeof tags === 'string' ? tags.split(/[,;]+/).map(t=>t.trim()).filter(Boolean) : []);
        const safeImages = Array.isArray(images) ? images.map(i => String(i).trim()).filter(Boolean) : (images ? [String(images).trim()] : []);

        // Sanitize units to match schema expectations
        let safeUnits = [];
        if (Array.isArray(units)) {
            safeUnits = units.map(u => {
                try {
                    const unitRaw = (u.unit || '').toString().toLowerCase();
                    let unitNorm = unitRaw;
                    if (/kg|kilogram|kilograms/.test(unitRaw)) unitNorm = 'kg';
                    if (/g|gram|grams/.test(unitRaw)) unitNorm = 'g';
                    if (/l|litre|liter|liters/.test(unitRaw)) unitNorm = 'litre';
                    if (/ml/.test(unitRaw)) unitNorm = 'ml';
                    if (/piece|pcs|pc|nos?/.test(unitRaw)) unitNorm = 'piece';

                    return {
                        unit: unitNorm || 'piece',
                        quantity: Number(u.quantity) || 1,
                        price: Number(u.price) || Number(price) || 0,
                        stock: Number(u.stock) || 0,
                        sku: u.sku || (sku || '')
                    };
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);
        }

        // Generate slug if not provided
        let productSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Check if slug is unique (append random string if duplicate)
        if (!slug) {
            const existingProduct = await Product.findOne({ slug: productSlug });
            if (existingProduct) {
                productSlug = productSlug + '-' + Date.now().toString(36);
            }
        }

        // Handle image upload to Cloudinary
        let imageUrl = 'product.jpg';
        let cloudinaryImages = [];

        if (req.file) {
            try {
                // Upload the file from temp storage to Cloudinary
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'kcp_organics/products',
                    resource_type: 'image',
                    use_filename: true,
                    unique_filename: true,
                });
                imageUrl = result.secure_url;
                console.log(`✅ Product image uploaded to Cloudinary: ${imageUrl}`);

                // Clean up temp file after upload
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) {
                    // Ignore cleanup errors
                }
            } catch (cloudErr) {
                console.error(`❌ Cloudinary upload failed: ${cloudErr.message}`);
                // Fallback: save the temp file path as local URL
                imageUrl = `/uploads/temp/${req.file.filename}`;
            }
        } else if (safeImages.length > 0) {
            // If no file but images array provided, check if any are local paths needing upload
            for (const img of safeImages) {
                if (img.startsWith('/uploads/') || img.startsWith('http')) {
                    cloudinaryImages.push(img);
                } else {
                    cloudinaryImages.push(img);
                }
            }
            imageUrl = safeImages[0];
        }

        // Also upload any additional images from the images array if they are local file paths
        if (safeImages.length > 0 && req.file) {
            // The main image is already set from req.file above
            // For additional images, we keep the provided URLs as-is
            cloudinaryImages = safeImages;
        } else if (safeImages.length > 0) {
            cloudinaryImages = safeImages;
        } else if (req.file) {
            cloudinaryImages = [imageUrl];
        }

        const newProduct = new Product({
            name,
            slug: productSlug,
            description: safeDescription,
            shortDescription: shortDescription || (safeDescription.substring ? safeDescription.substring(0, 200) : safeDescription),
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : Number(price),
            discount: discount ? Number(discount) : 0,
            cost: cost ? Number(cost) : undefined,
            stock: Number(stock) || 0,
            sku: sku || undefined,
            image: imageUrl,
            images: cloudinaryImages,
            category: safeCategory,
            subCategory,
            tags: safeTags,
            variants: variants || [],
            units: safeUnits,
            attributes: attributes || {},
            metaTitle: metaTitle || name,
            metaDescription: metaDescription || (shortDescription || safeDescription.substring(0,160)),
            metaKeywords: metaKeywords || [],
            isFeatured: isFeatured || false,
            isActive: isActive !== undefined ? isActive : true
        });

        await newProduct.save();
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('[Product POST] Error:', error);
        const errorMessage = error.message || 'Unknown error';
        const details = error.errors ? Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`).join('; ') : '';
        res.status(500).json({ 
            success: false, 
            message: `Error creating product: ${errorMessage}${details ? ' (' + details + ')' : ''}` 
        });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        
        // If name is updated, regenerate slug
        if (updates.name && !updates.slug) {
            updates.slug = updates.name.toLowerCase().replace(/\s+/g, '-');
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...updates, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('[Product PUT] Error:', error);
        const errorMessage = error.message || 'Unknown error';
        const details = error.errors ? Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`).join('; ') : '';
        res.status(500).json({ 
            success: false, 
            message: `Error updating product: ${errorMessage}${details ? ' (' + details + ')' : ''}` 
        });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bulk update product status
router.put('/bulk/status', async (req, res) => {
    try {
        const { productIds, isActive } = req.body;

        if (!Array.isArray(productIds)) {
            return res.status(400).json({ success: false, message: 'Product IDs must be an array' });
        }

        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { isActive, updatedAt: Date.now() }
        );

        res.status(200).json({
            success: true,
            message: `Updated ${result.modifiedCount} products`,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get low stock products (admin)
router.get('/admin/low-stock', async (req, res) => {
    try {
        const { threshold = 10 } = req.query;

        const products = await Product.find({
            stock: { $lte: parseInt(threshold) }
        }).sort({ stock: 1 });

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total: products.length,
                pages: 1
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Fix broken image references (admin cleanup endpoint)
router.post('/admin/fix-broken-images', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const uploadsDir = path.join(__dirname, '../uploads/products');
        
        // Get all image files that exist on disk
        const existingFiles = new Set(fs.readdirSync(uploadsDir));
        console.log(`📁 Found ${existingFiles.size} image files on disk`);
        
        // Find all products with missing images
        const allProducts = await Product.find({});
        let fixedCount = 0;
        let brokenCount = 0;
        
        for (const product of allProducts) {
            if (!product.image) continue;
            
            // Extract just the filename from the path
            const imagePath = product.image;
            let filename = imagePath;
            
            if (imagePath.includes('/')) {
                filename = imagePath.split('/').pop();
            }
            
            // Check if file exists
            if (!existingFiles.has(filename) && imagePath !== 'product.jpg') {
                console.log(`⚠️  Missing image for "${product.name}": ${filename}`);
                brokenCount++;
                
                // Set to default product.jpg
                product.image = 'product.jpg';
                await product.save();
                fixedCount++;
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Fixed ${fixedCount} products with broken images`,
            brokenCount,
            fixedCount
        });
    } catch (error) {
        console.error('❌ Error fixing broken images:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
