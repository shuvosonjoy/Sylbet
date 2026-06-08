const express = require('express');
const router = express.Router();

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const path = require('path');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sylbets-products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const { category, subcategory, featured, bestSelling, search, sort, page, limit: limitParam } = req.query;
    let query = {};
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (featured === 'true') query.featured = true;
    if (bestSelling === 'true') query.bestSelling = true;
    if (search) query.name = { $regex: search, $options: 'i' };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'latest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageNum = parseInt(page) || 1;
    const limit = parseInt(limitParam) || 20;
    const skip = (pageNum - 1) * limit;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
      .populate('subcategory')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').populate('subcategory');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post(
  '/',
  protect,
  admin,
  upload.array('images', 4),
  async (req, res) => {
    try {
      const {
        name,
        price,
        discountPrice,
        description,
        category,
        subcategory,
        stock,
        featured,
        bestSelling
      } = req.body;

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => file.path || file.secure_url);
      } else if (req.file) {
        imageUrls = [req.file.path || req.file.secure_url];
      }

      const product = new Product({
        name,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        description,
        category,
        subcategory: subcategory || null,
        image: imageUrls[0] || '',
        images: imageUrls,
        stock: Number(stock) || 0,
        featured: featured === 'true',
        bestSelling: bestSelling === 'true'
      });

      const createdProduct = await product.save();
      res.status(201).json(createdProduct);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put('/:id', protect, admin, upload.array('images', 4), async (req, res) => {
  try {
    const { name, price, discountPrice, description, category, subcategory, stock, featured, bestSelling, existingImages } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price ? Number(price) : product.price;
      product.discountPrice = discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : product.discountPrice;
      product.description = description || product.description;
      product.category = category || product.category;
      product.subcategory = subcategory !== undefined ? (subcategory || null) : product.subcategory;
      product.stock = stock !== undefined ? Number(stock) : product.stock;
      product.featured = featured !== undefined ? featured === 'true' : product.featured;
      product.bestSelling = bestSelling !== undefined ? bestSelling === 'true' : product.bestSelling;

      let keepImages = [];
      if (existingImages !== undefined) {
        try {
          keepImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
          if (!Array.isArray(keepImages)) keepImages = [keepImages];
        } catch {
          keepImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        }
      } else {
        keepImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
      }

      let newImageUrls = [];
      if (req.files && req.files.length > 0) {
        newImageUrls = req.files.map(file => file.path || file.secure_url);
      } else if (req.file) {
        newImageUrls = [req.file.path || req.file.secure_url];
      }

      const allImages = [...keepImages, ...newImageUrls].filter(Boolean);

      product.images = allImages.slice(0, 4);
      product.image = product.images[0] || '';

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
