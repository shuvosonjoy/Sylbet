const {
  getEffectiveUnitPrice,
  computeSubtotal,
  computeDeliveryChargeTotal,
  computeOrderTotals
} = require('../utils/pricing');

describe('pricing utilities', () => {
  describe('getEffectiveUnitPrice', () => {
    test('uses discountPrice when it is lower than price', () => {
      expect(getEffectiveUnitPrice({ price: 5000, discountPrice: 4500 })).toBe(4500);
    });

    test('falls back to price when discountPrice is null', () => {
      expect(getEffectiveUnitPrice({ price: 5000, discountPrice: null })).toBe(5000);
    });

    test('falls back to price when discountPrice is 0', () => {
      expect(getEffectiveUnitPrice({ price: 5000, discountPrice: 0 })).toBe(5000);
    });

    test('falls back to price when discountPrice >= price', () => {
      expect(getEffectiveUnitPrice({ price: 5000, discountPrice: 6000 })).toBe(5000);
    });
  });

  describe('computeSubtotal', () => {
    test('multiplies effective price by quantity for each item', () => {
      const items = [
        { product: 'a', price: 1000, quantity: 2 },
        { product: 'b', price: 500, discountPrice: 400, quantity: 3 }
      ];
      // 1000*2 + 400*3 = 3200
      expect(computeSubtotal(items)).toBe(3200);
    });

    test('returns 0 for an empty cart', () => {
      expect(computeSubtotal([])).toBe(0);
    });
  });

  describe('computeDeliveryChargeTotal — multi-product business rule', () => {
    test('sums each unique product\'s delivery charge once, regardless of quantity', () => {
      const items = [
        { product: 'a', deliveryCharge: 350, quantity: 5 },
        { product: 'b', deliveryCharge: 100, quantity: 2 }
      ];
      // 350 + 100 — NOT multiplied by quantity.
      expect(computeDeliveryChargeTotal(items)).toBe(450);
    });

    test('does not double-count if the same product id appears twice', () => {
      const items = [
        { product: 'a', deliveryCharge: 350, quantity: 1 },
        { product: 'a', deliveryCharge: 350, quantity: 1 }
      ];
      expect(computeDeliveryChargeTotal(items)).toBe(350);
    });

    test('treats missing deliveryCharge as 0 (legacy products)', () => {
      const items = [{ product: 'a', quantity: 1 }];
      expect(computeDeliveryChargeTotal(items)).toBe(0);
    });

    test('supports zero delivery charge (free delivery products)', () => {
      const items = [{ product: 'a', deliveryCharge: 0, quantity: 1 }];
      expect(computeDeliveryChargeTotal(items)).toBe(0);
    });
  });

  describe('computeOrderTotals', () => {
    test('matches the spec example: ৳5000 product + ৳350 delivery = ৳5350', () => {
      const items = [{ product: 'a', price: 5000, deliveryCharge: 350, quantity: 1 }];
      expect(computeOrderTotals(items)).toEqual({
        subtotal: 5000,
        deliveryChargeTotal: 350,
        totalAmount: 5350
      });
    });

    test('combines multiple distinct products correctly', () => {
      const items = [
        { product: 'a', price: 1000, deliveryCharge: 60, quantity: 2 },
        { product: 'b', price: 500, deliveryCharge: 80, quantity: 1 }
      ];
      // subtotal: 1000*2 + 500*1 = 2500
      // delivery: 60 + 80 = 140
      expect(computeOrderTotals(items)).toEqual({
        subtotal: 2500,
        deliveryChargeTotal: 140,
        totalAmount: 2640
      });
    });
  });
});
