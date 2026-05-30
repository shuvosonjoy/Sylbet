import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { showToast } from '../utils/toast';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart, getEffectivePrice } = useCart();
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    bkashTransactionId: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: getEffectivePrice(item)
        })),
        totalAmount: cartTotal
      };

      await api.createOrder(orderData, token);
      clearCart();
      showToast.success('Order placed successfully!');
      navigate('/order-success');
    } catch (err) {
      showToast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="container section">
      <h1 className="section-title text-center">Checkout</h1>

      <div className="checkout-grid">
        <div className="checkout-form">
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>Billing Details</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Optional - for order updates"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Delivery Address *</label>
              <textarea
                className="form-control"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Include House/Flat No, Road, Area, Thana, District"
                required
              ></textarea>
            </div>

            <div className="bkash-instructions" style={{ marginTop: 'var(--space-xl)' }}>
              <h3 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-primary-dark)' }}>Payment Information</h3>
              <p style={{ marginBottom: 'var(--space-sm)' }}>
                Please Send Money via bKash to our personal number: <strong>01XXXXXXXXX</strong>
              </p>
              <p>Amount to send: <strong>৳{cartTotal.toLocaleString()}</strong></p>
            </div>

            <div className="form-group">
              <label className="form-label">bKash Transaction ID *</label>
              <input
                type="text"
                className="form-control"
                name="bkashTransactionId"
                value={formData.bkashTransactionId}
                onChange={handleChange}
                placeholder="e.g. 9F8G7H6J"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: 'var(--space-xl)' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Place Order - ৳${cartTotal.toLocaleString()}`}
            </button>
          </form>
        </div>

        <div>
          <div className="cart-summary">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Order Items</h3>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              {cartItems.map(item => {
                const effectivePrice = getEffectivePrice(item);
                return (
                  <div key={item._id} className="summary-row" style={{ alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-muted text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium text-sm">
                      ৳{(effectivePrice * item.quantity).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span className="text-accent">৳{cartTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
