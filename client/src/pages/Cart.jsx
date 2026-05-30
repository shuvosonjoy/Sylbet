import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';
import PriceDisplay from '../components/PriceDisplay';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, getEffectivePrice } = useCart();
  const navigate = useNavigate();

  const handleRemove = (id) => {
    removeFromCart(id);
    showToast.success('Removed from cart');
  };

  if (cartItems.length === 0) {
    return (
      <div className="container section empty-state">
        <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 className="section-title">Your Cart is Empty</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">Your Cart</h1>

      <div className="cart-layout">
        <div className="cart-items-container card" style={{ padding: 'var(--space-lg)' }}>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => {
                const effectivePrice = getEffectivePrice(item);
                return (
                  <tr key={item._id}>
                    <td>
                      <div className="cart-item-info">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="cart-item-img" />
                        ) : (
                          <div className="cart-item-img cart-item-img-placeholder">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <Link to={`/product/${item._id}`} className="font-medium">{item.name}</Link>
                          {item.category?.name && <p className="text-sm text-muted">{item.category.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <PriceDisplay price={item.price} discountPrice={item.discountPrice} size="sm" />
                    </td>
                    <td>
                      <div className="qty-selector" style={{ marginBottom: 0 }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={14} /></button>
                        <input type="number" className="qty-input" value={item.quantity} readOnly />
                        <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </td>
                    <td className="font-medium text-primary-dark">৳{(effectivePrice * item.quantity).toLocaleString()}</td>
                    <td>
                      <button className="remove-btn" onClick={() => handleRemove(item._id)} aria-label="Remove item">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <div className="cart-summary">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Order Summary</h3>
            <div className="summary-row">
              <span className="text-muted">Subtotal ({cartItems.reduce((c, i) => c + i.quantity, 0)} items)</span>
              <span className="font-medium">৳{cartTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Shipping</span>
              <span className="font-medium" style={{ color: 'var(--color-success)' }}>Calculated at Checkout</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>৳{cartTotal.toLocaleString()}</span>
            </div>
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 'var(--space-lg)' }}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
          <div className="text-center" style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/shop" className="text-muted">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
