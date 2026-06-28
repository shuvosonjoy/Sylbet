const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  optionValues: { type: Map, of: String },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: null },
  stock: { type: Number, default: 0 },
  sku: { type: String, default: '' },
  images: [{ type: String }],
  weight: { type: Number, default: null },
  dimensions: {
    length: { type: Number, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null }
  },
  deliveryCharge: { type: Number, default: null },
  isActive: { type: Boolean, default: true }
}, { _id: true });

const variantOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  values: [{ type: String }]
}, { _id: false });

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  productType: { type: String, enum: ['simple', 'variable'], default: 'simple' },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: null },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
  image: { type: String, default: '' },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative']
  },
  featured: { type: Boolean, default: false },
  bestSelling: { type: Boolean, default: false },
  variantOptions: [variantOptionSchema],
  variants: [variantSchema],
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
    if (ret.deliveryCharge == null) ret.deliveryCharge = 0;

    if (ret.productType === 'variable' && ret.variants && ret.variants.length > 0) {
      const activeVariants = ret.variants.filter(v => v.isActive);
      if (activeVariants.length > 0) {
        const prices = activeVariants.map(v => {
          const effective = (v.salePrice != null && v.salePrice > 0 && v.salePrice < v.price)
            ? v.salePrice : v.price;
          return effective;
        });
        ret.minPrice = Math.min(...prices);
        ret.maxPrice = Math.max(...prices);
        ret.totalStock = activeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

        // Convert optionValues Map to plain objects for JSON serialization
        ret.variants = ret.variants.map(v => {
          const variant = { ...v };
          if (v.optionValues instanceof Map) {
            variant.optionValues = Object.fromEntries(v.optionValues);
          } else if (v.optionValues && typeof v.optionValues.toJSON === 'function') {
            variant.optionValues = v.optionValues.toJSON();
          }
          return variant;
        });
      } else {
        ret.minPrice = ret.price;
        ret.maxPrice = ret.price;
        ret.totalStock = 0;
      }
    }

    return ret;
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
