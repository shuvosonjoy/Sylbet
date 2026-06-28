const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customerName: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  bkashTransactionId: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    deliveryCharge: { type: Number, default: 0, min: 0 },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantOptions: { type: Map, of: String, default: null }
  }],
  // Order-level breakdown, captured server-side. Legacy orders that pre-date
  // these fields default to 0 / fall back to totalAmount where appropriate.
  subtotal: { type: Number, default: 0 },
  deliveryChargeTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
