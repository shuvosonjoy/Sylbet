const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: [{ path: 'category' }, { path: 'subcategory' }]
    });
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
