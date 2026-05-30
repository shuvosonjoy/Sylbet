const mongoose = require('mongoose');

const subcategorySchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String, default: '' }
});

subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;
