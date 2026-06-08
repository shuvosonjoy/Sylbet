const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: null },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
  image: { type: String, default: '' },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  bestSelling: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    if (!ret.images || ret.images.length === 0) {
      ret.images = ret.image ? [ret.image] : [];
    }
    if (ret.images && ret.images.length > 0 && !ret.image) {
      ret.image = ret.images[0];
    }
    return ret;
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
