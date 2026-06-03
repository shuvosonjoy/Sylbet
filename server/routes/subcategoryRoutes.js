const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Subcategory = require('../models/Subcategory');
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
    const { category } = req.query;
    let query = {};
    if (category) query.category = category;

    const subcategories = await Subcategory.find(query).populate('category');
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id).populate('category');
    if (subcategory) {
      res.json(subcategory);
    } else {
      res.status(404).json({ message: 'Subcategory not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const image = req.file ? req.file.secure_url : '';
    console.log('Create Subcategory - File:', req.file ? 'YES' : 'NO', 'Image URL:', image);
    const subcategory = new Subcategory({ name, description, category, image });
    const created = await subcategory.save();
    res.status(201).json(created);
  } catch (error) {
    console.error('Create Subcategory Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);
    console.log('Update Subcategory - File:', req.file ? 'YES' : 'NO', 'Image URL:', req.file?.secure_url);

    if (subcategory) {
      subcategory.name = name || subcategory.name;
      subcategory.description = description !== undefined ? description : subcategory.description;
      subcategory.category = category || subcategory.category;
      if (req.file) {
        subcategory.image = req.file.secure_url;
        console.log('Image updated to:', subcategory.image);
      }

      const updated = await subcategory.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Subcategory not found' });
    }
  } catch (error) {
    console.error('Update Subcategory Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (subcategory) {
      await subcategory.deleteOne();
      res.json({ message: 'Subcategory removed' });
    } else {
      res.status(404).json({ message: 'Subcategory not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
