const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
