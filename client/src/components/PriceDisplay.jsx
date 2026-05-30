import React from 'react';

const PriceDisplay = ({ price, discountPrice, size = 'md' }) => {
  const hasDiscount = discountPrice && discountPrice < price;
  const discountPercentage = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;

  const sizeClasses = {
    sm: { main: '1rem', original: '0.8rem' },
    md: { main: '1.25rem', original: '0.95rem' },
    lg: { main: '2rem', original: '1.25rem' },
  };

  const s = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="price-display">
      {hasDiscount ? (
        <>
          <span className="price-current" style={{ fontSize: s.main }}>
            ৳{discountPrice.toLocaleString()}
          </span>
          <span className="price-original" style={{ fontSize: s.original }}>
            ৳{price.toLocaleString()}
          </span>
          <span className="price-discount-badge">-{discountPercentage}%</span>
        </>
      ) : (
        <span className="price-current" style={{ fontSize: s.main }}>
          ৳{price.toLocaleString()}
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;
