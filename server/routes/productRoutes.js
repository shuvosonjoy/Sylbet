const express = require('express');
const router = express.Router();

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

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

const parseJsonField = (value) => {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return undefined; }
};

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
        deliveryCharge,
        featured,
        bestSelling,
        productType,
        variantOptions: variantOptionsRaw,
        variants: variantsRaw
      } = req.body;

      if (deliveryCharge === undefined || deliveryCharge === null || deliveryCharge === '') {
        return res.status(400).json({ message: 'Delivery charge is required' });
      }
      const parsedDeliveryCharge = Number(deliveryCharge);
      if (Number.isNaN(parsedDeliveryCharge) || parsedDeliveryCharge < 0) {
        return res.status(400).json({ message: 'Delivery charge must be a non-negative number' });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => file.path || file.secure_url);
      } else if (req.file) {
        imageUrls = [req.file.path || req.file.secure_url];
      }

      const type = productType === 'variable' ? 'variable' : 'simple';
      const variantOptions = parseJsonField(variantOptionsRaw) || [];
      const variants = parseJsonField(variantsRaw) || [];

      if (type === 'variable' && variants.length === 0) {
        return res.status(400).json({ message: 'Variable products must have at least one variant' });
      }

      const productData = {
        name,
        productType: type,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        description,
        category,
        subcategory: subcategory || null,
        image: imageUrls[0] || '',
        images: imageUrls,
        stock: Number(stock) || 0,
        deliveryCharge: parsedDeliveryCharge,
        featured: featured === 'true',
        bestSelling: bestSelling === 'true',
        variantOptions: type === 'variable' ? variantOptions : [],
        variants: type === 'variable' ? variants : []
      };

      const product = new Product(productData);
      const createdProduct = await product.save();
      res.status(201).json(createdProduct);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put('/:id', protect, admin, upload.array('images', 4), async (req, res) => {
  try {
    const {
      name, price, discountPrice, description, category, subcategory,
      stock, deliveryCharge, featured, bestSelling, existingImages,
      productType, variantOptions: variantOptionsRaw, variants: variantsRaw
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price ? Number(price) : product.price;
      product.discountPrice = discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : product.discountPrice;
      product.description = description || product.description;
      product.category = category || product.category;
      product.subcategory = subcategory !== undefined ? (subcategory || null) : product.subcategory;
      product.stock = stock !== undefined ? Number(stock) : product.stock;

      if (deliveryCharge !== undefined && deliveryCharge !== '') {
        const parsedDeliveryCharge = Number(deliveryCharge);
        if (Number.isNaN(parsedDeliveryCharge) || parsedDeliveryCharge < 0) {
          return res.status(400).json({ message: 'Delivery charge must be a non-negative number' });
        }
        product.deliveryCharge = parsedDeliveryCharge;
      }

      product.featured = featured !== undefined ? featured === 'true' : product.featured;
      product.bestSelling = bestSelling !== undefined ? bestSelling === 'true' : product.bestSelling;

      // Product type
      if (productType !== undefined) {
        product.productType = productType === 'variable' ? 'variable' : 'simple';
      }

      // Variant data
      const parsedVariantOptions = parseJsonField(variantOptionsRaw);
      const parsedVariants = parseJsonField(variantsRaw);

      if (product.productType === 'variable') {
        if (parsedVariantOptions !== undefined) {
          product.variantOptions = parsedVariantOptions;
        }
        if (parsedVariants !== undefined) {
          product.variants = parsedVariants;
        }
      } else {
        product.variantOptions = [];
        product.variants = [];
      }

      // Handle images
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
