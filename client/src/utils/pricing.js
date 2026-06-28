/**
 * Client-side mirror of server/utils/pricing.js. Server is the source of truth
 * (it recomputes totals on order creation), but the storefront needs the same
 * math for cart/checkout display.
 *
 * IMPORTANT: keep this in sync with server/utils/pricing.js. The multi-product
 * delivery rule is documented there.
 */

export const getEffectiveUnitPrice = (item) => {
  const price = Number(item.price) || 0;
  const discount = item.salePrice != null ? Number(item.salePrice)
    : item.discountPrice != null ? Number(item.discountPrice)
    : null;
  return discount != null && discount > 0 && discount < price ? discount : price;
};

export const computeSubtotal = (items) =>
  items.reduce((sum, item) => sum + getEffectiveUnitPrice(item) * (Number(item.quantity) || 0), 0);

export const computeDeliveryChargeTotal = (items) => {
  const seen = new Set();
  let total = 0;
  for (const item of items) {
    const productKey = String(item._id || item.product || item.name);
    const key = item.variantId ? `${productKey}-${item.variantId}` : productKey;
    if (seen.has(key)) continue;
    seen.add(key);
    total += Number(item.deliveryCharge) || 0;
  }
  return total;
};

export const computeOrderTotals = (items) => {
  const subtotal = computeSubtotal(items);
  const deliveryChargeTotal = computeDeliveryChargeTotal(items);
  return {
    subtotal,
    deliveryChargeTotal,
    totalAmount: subtotal + deliveryChargeTotal
  };
};
