const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, admin, optionalAuth } = require('../middleware/auth');
const { computeOrderTotals, getEffectiveUnitPrice } = require('../utils/pricing');

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { customerName, email, phone, address, bkashTransactionId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const hydratedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.name}` });
      }

      let unitPrice, deliveryCharge, variantId = null, variantOpts = null;

      if (item.variantId && product.productType === 'variable') {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          return res.status(400).json({ message: `Variant not found for "${product.name}"` });
        }
        if (!variant.isActive) {
          return res.status(400).json({ message: `Variant is no longer available for "${product.name}"` });
        }
        if (variant.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}" variant. Available: ${variant.stock}, Requested: ${item.quantity}`
          });
        }
        unitPrice = getEffectiveUnitPrice({
          price: variant.price,
          discountPrice: variant.salePrice
        });
        deliveryCharge = variant.deliveryCharge != null ? variant.deliveryCharge : (Number(product.deliveryCharge) || 0);
        variantId = variant._id;
        variantOpts = variant.optionValues instanceof Map
          ? Object.fromEntries(variant.optionValues)
          : variant.optionValues;
      } else {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          });
        }
        unitPrice = getEffectiveUnitPrice({
          price: product.price,
          discountPrice: product.discountPrice
        });
        deliveryCharge = Number(product.deliveryCharge) || 0;
      }

      hydratedItems.push({
        product: product._id,
        name: product.name,
        quantity: Number(item.quantity),
        price: unitPrice,
        deliveryCharge,
        variantId,
        variantOptions: variantOpts
      });
    }

    for (const item of hydratedItems) {
      if (item.variantId) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    const totals = computeOrderTotals(hydratedItems);

    const order = new Order({
      user: req.user ? req.user._id : null,
      customerName,
      email: email || '',
      phone,
      address,
      bkashTransactionId,
      items: hydratedItems,
      subtotal: totals.subtotal,
      deliveryChargeTotal: totals.deliveryChargeTotal,
      totalAmount: totals.totalAmount
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('items.product').populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      // If cancelling, restore stock
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        for (const item of order.items) {
          if (item.variantId) {
            await Product.findOneAndUpdate(
              { _id: item.product, 'variants._id': item.variantId },
              { $inc: { 'variants.$.stock': item.quantity } }
            );
          } else {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity }
            });
          }
        }
      }
      order.status = status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
