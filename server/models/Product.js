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
  // Per-product delivery charge in BDT. Required at the application layer for new
  // products (admin form), but defaulted to 0 so existing documents keep working
  // without a migration. Validator rejects negatives.
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative']
  },
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
    // Ensure legacy products without the field still surface a numeric value to clients.
    if (ret.deliveryCharge == null) ret.deliveryCharge = 0;
    return ret;
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
