const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Review = require('../models/Review');
const { protect, admin } = require('../middleware/auth');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sylbets-reviews',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const query = { status: 'published' };
    if (req.query.featured === 'true') query.featured = true;

    const reviews = await Review.find(query)
      .populate('product', 'name')
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/admin', protect, admin, async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('product', 'name')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const { customerName, location, text, rating, product, reviewDate, status, featured } = req.body;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.path || file.secure_url);
    }

    const count = await Review.countDocuments();

    const review = new Review({
      customerName,
      location: location || '',
      text,
      rating: Number(rating),
      images: imageUrls,
      product: product || null,
      reviewDate: reviewDate || null,
      status: status || 'published',
      featured: featured === 'true' || featured === true,
      sortOrder: count,
    });

    const created = await review.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.put('/reorder', protect, admin, async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ message: 'orders array required' });
    }

    const ops = orders.map(({ id, sortOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { sortOrder }
      }
    }));

    await Review.bulkWrite(ops);
    res.json({ message: 'Reorder successful' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.put('/:id', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { customerName, location, text, rating, product, reviewDate, status, featured, existingImages } = req.body;

    review.customerName = customerName || review.customerName;
    review.location = location !== undefined ? location : review.location;
    review.text = text || review.text;
    review.rating = rating ? Number(rating) : review.rating;
    review.product = product !== undefined ? (product || null) : review.product;
    review.reviewDate = reviewDate !== undefined ? (reviewDate || null) : review.reviewDate;
    review.status = status || review.status;
    review.featured = featured !== undefined ? (featured === 'true' || featured === true) : review.featured;

    let keepImages = [];
    if (existingImages !== undefined) {
      try {
        keepImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        if (!Array.isArray(keepImages)) keepImages = [keepImages];
      } catch {
        keepImages = Array.isArray(existingImages) ? existingImages : [existingImages];
      }
    } else {
      keepImages = review.images || [];
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      newImageUrls = req.files.map(file => file.path || file.secure_url);
    }

    review.images = [...keepImages, ...newImageUrls].filter(Boolean).slice(0, 5);

    const updated = await review.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await review.deleteOne();
    res.json({ message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
