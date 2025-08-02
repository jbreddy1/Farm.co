const express = require('express');
const router = express.Router();
const multer = require('multer');
const FarmerProduct = require('../models/FarmerProduct');
const path = require('path');
const fs = require('fs');

// Use disk storage for product images
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.', 400));
    }
  }
});

// Mock image upload function - in a real app, this would upload to a cloud service
// and return the public URL.
const uploadImageToCloud = async (file) => {
  // For now, we'll simulate this by returning a placeholder URL.
  // This part needs to be replaced with a real implementation.
  console.log(`Simulating upload for file: ${file.originalname}`);
  return `https://via.placeholder.com/300x200.png?text=${encodeURIComponent(file.originalname)}`;
};


// POST /api/farmer-products - Create a new product for a farmer
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, unit, category, stock, farmerId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Product image is required.' });
    }

    // Save image URL as static path
    const imageUrl = `/uploads/products/${req.file.filename}`;

    const newProduct = new FarmerProduct({
      name,
      description,
      price,
      unit,
      category,
      stock,
      farmerId,
      imageUrl
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product.', details: error.message });
  }
});

// GET /api/farmer-products/farmer/:farmerId - Get all products for a specific farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const products = await FarmerProduct.find({ farmerId: req.params.farmerId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products.', details: error.message });
  }
});

// GET /api/farmer-products - Get all products from all farmers (for the marketplace view)
router.get('/', async (req, res) => {
  try {
    const products = await FarmerProduct.find({ isAvailable: true, stock: { $gt: 0 } })
      .populate('farmerId', 'name farmName') // Populate farmer's name and farm name
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketplace products.', details: error.message });
  }
});

// PUT /api/farmer-products/:productId - Update a product
router.put('/:productId', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, unit, category, stock, isAvailable } = req.body;
    const updateData = { name, description, price, unit, category, stock };
    if (typeof isAvailable !== 'undefined') {
      updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    if (req.file) {
      updateData.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const updatedProduct = await FarmerProduct.findByIdAndUpdate(
      req.params.productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product.', details: error.message });
  }
});

// DELETE /api/farmer-products/:productId - Delete a product
router.delete('/:productId', async (req, res) => {
  try {
    const deletedProduct = await FarmerProduct.findByIdAndDelete(req.params.productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product.', details: error.message });
  }
});

module.exports = router; 