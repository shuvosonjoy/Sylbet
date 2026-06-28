/**
 * Shared pricing helpers used by both server (authoritative) and mirrored on
 * the client for display. Keep these pure and free of side effects.
 *
 * Multi-product delivery charge rule:
 *   The order-level delivery charge is the sum of each unique product's
 *   deliveryCharge — it is NOT multiplied by quantity. The reasoning: the
 *   delivery charge reflects per-shipment cost (packaging + courier) that the
 *   merchant attaches to the SKU, not a per-unit handling fee. Buying 3 of the
 *   same product ships in one parcel, so charging once is the expected
 *   behaviour for this store.
 *
 *   If the business later wants per-unit delivery, switch to:
 *     sum(item.deliveryCharge * item.quantity)
 *   in computeDeliveryChargeTotal below — every other layer (order model,
 *   checkout UI, invoice) already reads from this single source of truth.
 */

const getEffectiveUnitPrice = (item) => {
  const price = Number(item.price) || 0;
  const discount = item.salePrice != null ? Number(item.salePrice)
    : item.discountPrice != null ? Number(item.discountPrice)
    : null;
  return discount != null && discount > 0 && discount < price ? discount : price;
};

const computeSubtotal = (items) =>
  items.reduce((sum, item) => sum + getEffectiveUnitPrice(item) * (Number(item.quantity) || 0), 0);

const computeDeliveryChargeTotal = (items) => {
  const seen = new Set();
  let total = 0;
  for (const item of items) {
    const productKey = String(item.product || item._id || item.name);
    const key = item.variantId ? `${productKey}-${item.variantId}` : productKey;
    if (seen.has(key)) continue;
    seen.add(key);
    total += Number(item.deliveryCharge) || 0;
  }
  return total;
};

const computeOrderTotals = (items) => {
  const subtotal = computeSubtotal(items);
  const deliveryChargeTotal = computeDeliveryChargeTotal(items);
  return {
    subtotal,
    deliveryChargeTotal,
    totalAmount: subtotal + deliveryChargeTotal
  };
};

module.exports = {
  getEffectiveUnitPrice,
  computeSubtotal,
  computeDeliveryChargeTotal,
  computeOrderTotals
};
