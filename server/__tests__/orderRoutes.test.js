/**
 * Integration tests for order creation, focused on:
 *   - delivery charge being snapshotted from the Product collection (not client),
 *   - order totals being recomputed server-side,
 *   - the per-item deliveryCharge surviving on the saved order.
 */

jest.mock('../models/Product', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn().mockResolvedValue({})
}));

jest.mock('../models/Order', () => {
  const OrderMock = jest.fn();
  return OrderMock;
});

jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => { req.user = { _id: 'u', role: 'admin' }; next(); },
  admin: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next()
}));

const express = require('express');
const request = require('supertest');
const Product = require('../models/Product');
const Order = require('../models/Order');
const orderRoutes = require('../routes/orderRoutes');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  return app;
};

describe('POST /api/orders — delivery charge integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Product.findByIdAndUpdate.mockResolvedValue({});
  });

  test('rejects empty cart', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/orders').send({
      customerName: 'A', phone: '1', address: 'x', bkashTransactionId: 't', items: []
    });
    expect(res.status).toBe(400);
  });

  test('snapshots deliveryCharge from product, ignoring client-supplied value', async () => {
    Product.findById.mockResolvedValue({
      _id: 'p1', name: 'P1', price: 5000, discountPrice: null, deliveryCharge: 350, stock: 10
    });

    let savedOrder;
    Order.mockImplementation(function (data) {
      Object.assign(this, data);
      savedOrder = this;
      this.save = jest.fn().mockResolvedValue({ _id: 'o1', ...data });
    });

    const app = buildApp();
    const res = await request(app).post('/api/orders').send({
      customerName: 'A', phone: '1', address: 'x', bkashTransactionId: 't',
      items: [{ product: 'p1', name: 'P1', quantity: 1, price: 1, deliveryCharge: 1 }] // client lies
    });

    expect(res.status).toBe(201);
    expect(savedOrder.items[0].price).toBe(5000); // server-side, not client value
    expect(savedOrder.items[0].deliveryCharge).toBe(350);
    expect(savedOrder.subtotal).toBe(5000);
    expect(savedOrder.deliveryChargeTotal).toBe(350);
    expect(savedOrder.totalAmount).toBe(5350);
  });

  test('multi-product order: sums each unique deliveryCharge once', async () => {
    Product.findById.mockImplementation((id) => {
      if (id === 'p1') return Promise.resolve({ _id: 'p1', name: 'P1', price: 1000, discountPrice: null, deliveryCharge: 60, stock: 10 });
      if (id === 'p2') return Promise.resolve({ _id: 'p2', name: 'P2', price: 500, discountPrice: null, deliveryCharge: 80, stock: 10 });
      return Promise.resolve(null);
    });

    let savedOrder;
    Order.mockImplementation(function (data) {
      Object.assign(this, data);
      savedOrder = this;
      this.save = jest.fn().mockResolvedValue({ _id: 'o1', ...data });
    });

    const app = buildApp();
    const res = await request(app).post('/api/orders').send({
      customerName: 'A', phone: '1', address: 'x', bkashTransactionId: 't',
      items: [
        { product: 'p1', quantity: 2 },
        { product: 'p2', quantity: 1 }
      ]
    });

    expect(res.status).toBe(201);
    expect(savedOrder.subtotal).toBe(2500);          // 1000*2 + 500
    expect(savedOrder.deliveryChargeTotal).toBe(140); // 60 + 80, not multiplied by qty
    expect(savedOrder.totalAmount).toBe(2640);
  });

  test('rejects insufficient stock', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', name: 'P1', price: 100, discountPrice: null, deliveryCharge: 0, stock: 1 });
    const app = buildApp();
    const res = await request(app).post('/api/orders').send({
      customerName: 'A', phone: '1', address: 'x', bkashTransactionId: 't',
      items: [{ product: 'p1', quantity: 5 }]
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/i);
  });

  test('uses discountPrice when lower than price', async () => {
    Product.findById.mockResolvedValue({ _id: 'p1', name: 'P1', price: 1000, discountPrice: 800, deliveryCharge: 50, stock: 10 });
    let savedOrder;
    Order.mockImplementation(function (data) {
      Object.assign(this, data);
      savedOrder = this;
      this.save = jest.fn().mockResolvedValue({ _id: 'o1', ...data });
    });

    const app = buildApp();
    await request(app).post('/api/orders').send({
      customerName: 'A', phone: '1', address: 'x', bkashTransactionId: 't',
      items: [{ product: 'p1', quantity: 2 }]
    });

    expect(savedOrder.items[0].price).toBe(800);
    expect(savedOrder.subtotal).toBe(1600);
    expect(savedOrder.deliveryChargeTotal).toBe(50);
    expect(savedOrder.totalAmount).toBe(1650);
  });
});
