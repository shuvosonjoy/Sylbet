const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: null },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  bestSelling: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
