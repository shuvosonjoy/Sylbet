const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, admin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find({});
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (setting) {
      res.json({ key: setting.key, value: setting.value });
    } else {
      res.json({ key: req.params.key, value: null });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/:key', protect, admin, async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { key: req.params.key, value },
      { upsert: true, new: true }
    );
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
