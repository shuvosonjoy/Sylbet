import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderSuccess = () => {
  return (
    <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <CheckCircle size={80} color="var(--color-success)" style={{ marginBottom: 'var(--space-lg)' }} />
      <h1 className="section-title">Order Placed Successfully!</h1>
      <p className="text-lg text-muted" style={{ maxWidth: '600px', margin: '0 auto var(--space-xl)' }}>
        Thank you for your purchase from Sylbets. We have received your order details.
        We will verify your bKash payment and contact you shortly to confirm delivery.
      </p>
      <Link to="/shop" className="btn btn-primary">
        Continue Shopping
      </Link>
    </div>
  );
};

export default OrderSuccess;
