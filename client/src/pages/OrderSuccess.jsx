import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderSuccess = () => {
  // The Checkout page now passes the persisted order in router state so this
  // page doubles as an invoice. If a user lands here directly (refresh), we
  // gracefully fall back to the original generic confirmation.
  const { state } = useLocation();
  const order = state?.order || null;

  return (
    <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <CheckCircle size={80} color="var(--color-success)" style={{ marginBottom: 'var(--space-lg)' }} />
      <h1 className="section-title">Order Placed Successfully!</h1>
      <p className="text-lg text-muted" style={{ maxWidth: '600px', margin: '0 auto var(--space-lg)' }}>
        Thank you for your purchase from Sylbets. We have received your order details.
        We will verify your bKash payment and contact you shortly to confirm delivery.
      </p>

      {order && (
        <div className="card" style={{ maxWidth: '560px', width: '100%', margin: '0 auto var(--space-xl)', textAlign: 'left', padding: 'var(--space-lg)' }}>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>Invoice</h3>

          <div style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
            <div className="text-muted">Order ID: <span style={{ color: 'var(--color-text)' }}>{order._id}</span></div>
            {order.createdAt && (
              <div className="text-muted">Date: <span style={{ color: 'var(--color-text)' }}>{new Date(order.createdAt).toLocaleString()}</span></div>
            )}
            <div className="text-muted">bKash Transaction: <span style={{ color: 'var(--color-text)' }}>{order.bkashTransactionId}</span></div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
            {order.items?.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '4px' }}>
                <span>{it.name} <span className="text-muted">x{it.quantity}</span></span>
                <span>৳{Number((it.price || 0) * it.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Subtotal</span>
              <span>৳{Number(order.subtotal || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span className="text-muted">Delivery Charge</span>
              <span>৳{Number(order.deliveryChargeTotal || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)', fontWeight: 600 }}>
              <span>Total Paid</span>
              <span className="text-accent">৳{Number(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <Link to="/shop" className="btn btn-primary">
        Continue Shopping
      </Link>
    </div>
  );
};

export default OrderSuccess;
