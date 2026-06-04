const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sylbets-categories',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    console.log('=== Create Category ===');
    console.log('Body:', { name, description });
    console.log('File exists:', !!req.file);
    if (req.file) {
      console.log('File details:', { fieldname: req.file.fieldname, originalname: req.file.originalname, size: req.file.size });
      console.log('Cloudinary secure_url:', req.file.secure_url);
    } else {
      console.log('NO FILE IN REQUEST');
    }
    const image = req.file ? (req.file.path || req.file.secure_url) : '';
    const category = new Category({ name, description, image });
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.description = description !== undefined ? description : category.description;
      if (req.file) {
        category.image = req.file.path || req.file.secure_url;
      }

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      await category.deleteOne();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
