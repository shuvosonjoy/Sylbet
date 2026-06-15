import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMyOrders(token);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, isAuthenticated]);

  if (loading) return <div className="container section"><div className="spinner"></div></div>;

  if (!isAuthenticated) {
    return (
      <div className="container section empty-state">
        <h3>Please login to view your orders</h3>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Login</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title text-center">My Orders</h1>

      {orders.length === 0 ? (
        <div className="empty-state">
          <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No orders yet</h3>
          <p>Start shopping to see your orders here</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Products</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="card order-card">
              <div className="order-card-header">
                <div>
                  <span className="text-muted text-sm">Order Date</span>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className={`status-badge status-${order.status}`}>{order.status || 'Pending'}</span>
              </div>
              <div className="order-card-items">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted">x{item.quantity}</span>
                    <span>৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="order-card-footer" style={{ display: 'block' }}>
                {/* Show breakdown when the order has the new fields. Older orders
                    that pre-date this feature only have totalAmount. */}
                {(order.subtotal != null || order.deliveryChargeTotal != null) && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span className="text-muted">Subtotal</span>
                      <span>৳{Number(order.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '4px' }}>
                      <span className="text-muted">Delivery Charge</span>
                      <span>৳{Number(order.deliveryChargeTotal || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-muted">Total Amount</span>
                  <span className="font-medium text-primary-dark" style={{ fontSize: '1.125rem' }}>৳{Number(order.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
