/**
 * Integration tests for product create/edit, focused on the deliveryCharge
 * field. The Product model is mocked at the module boundary so these tests
 * do not require a live MongoDB.
 */

jest.mock('../models/Product', () => {
  const ProductMock = jest.fn();
  ProductMock.findById = jest.fn();
  return ProductMock;
});

jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => { req.user = { _id: 'admin-id', role: 'admin' }; next(); },
  admin: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next()
}));

// multer-storage-cloudinary needs a configured cloudinary instance at import
// time. Stub the cloudinary config + the multer storage to avoid that.
jest.mock('../config/cloudinary', () => ({}));
jest.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: function () { return { _handleFile: (req, file, cb) => cb(null, {}), _removeFile: (req, file, cb) => cb(null) }; }
}));

const express = require('express');
const request = require('supertest');
const Product = require('../models/Product');
const productRoutes = require('../routes/productRoutes');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/products', productRoutes);
  return app;
};

describe('POST /api/products — deliveryCharge handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects creation when deliveryCharge is missing', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/products')
      .field('name', 'Test')
      .field('price', '100')
      .field('description', 'desc')
      .field('category', '507f1f77bcf86cd799439011')
      .field('stock', '5');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Delivery charge is required/i);
  });

  test('rejects negative deliveryCharge', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/products')
      .field('name', 'Test')
      .field('price', '100')
      .field('description', 'desc')
      .field('category', '507f1f77bcf86cd799439011')
      .field('stock', '5')
      .field('deliveryCharge', '-10');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-negative/i);
  });

  test('accepts deliveryCharge of 0 (free delivery)', async () => {
    Product.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue({ _id: 'new-id', ...data });
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/products')
      .field('name', 'Free Delivery Item')
      .field('price', '100')
      .field('description', 'desc')
      .field('category', '507f1f77bcf86cd799439011')
      .field('stock', '5')
      .field('deliveryCharge', '0');

    expect(res.status).toBe(201);
    expect(Product).toHaveBeenCalledWith(expect.objectContaining({ deliveryCharge: 0 }));
  });

  test('persists positive deliveryCharge as a number', async () => {
    Product.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue({ _id: 'new-id', ...data });
    });

    const app = buildApp();
    const res = await request(app)
      .post('/api/products')
      .field('name', 'Charged Item')
      .field('price', '5000')
      .field('description', 'desc')
      .field('category', '507f1f77bcf86cd799439011')
      .field('stock', '5')
      .field('deliveryCharge', '350');

    expect(res.status).toBe(201);
    expect(Product).toHaveBeenCalledWith(expect.objectContaining({ deliveryCharge: 350 }));
  });
});

describe('PUT /api/products/:id — deliveryCharge handling', () => {
  beforeEach(() => jest.clearAllMocks());

  test('rejects negative deliveryCharge on update', async () => {
    Product.findById.mockResolvedValue({
      name: 'Old', price: 100, deliveryCharge: 50, images: [], image: '',
      save: jest.fn()
    });

    const app = buildApp();
    const res = await request(app)
      .put('/api/products/507f1f77bcf86cd799439011')
      .field('deliveryCharge', '-5');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-negative/i);
  });

  test('updates deliveryCharge when provided', async () => {
    const fakeProduct = {
      name: 'Old', price: 100, deliveryCharge: 50, images: [], image: '',
      save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
    };
    Product.findById.mockResolvedValue(fakeProduct);

    const app = buildApp();
    const res = await request(app)
      .put('/api/products/507f1f77bcf86cd799439011')
      .field('deliveryCharge', '120');

    expect(res.status).toBe(200);
    expect(fakeProduct.deliveryCharge).toBe(120);
  });

  test('leaves deliveryCharge untouched when the field is omitted (backward compat)', async () => {
    const fakeProduct = {
      name: 'Old', price: 100, deliveryCharge: 75, images: [], image: '',
      save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
    };
    Product.findById.mockResolvedValue(fakeProduct);

    const app = buildApp();
    const res = await request(app)
      .put('/api/products/507f1f77bcf86cd799439011')
      .field('name', 'Renamed');

    expect(res.status).toBe(200);
    expect(fakeProduct.deliveryCharge).toBe(75);
    expect(fakeProduct.name).toBe('Renamed');
  });
});
