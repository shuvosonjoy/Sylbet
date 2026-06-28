const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  customerName: { type: String, required: true },
  location: { type: String, default: '' },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  images: [{ type: String }],
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  reviewDate: { type: Date, default: null },
  status: { type: String, enum: ['published', 'draft', 'hidden'], default: 'published' },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
