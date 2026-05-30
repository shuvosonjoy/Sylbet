import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="card product-card skeleton-card">
    <div className="skeleton skeleton-img"></div>
    <div className="product-info">
      <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '80%', height: '18px', marginTop: '8px' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '50%', height: '20px', marginTop: '12px' }}></div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const HeroSkeleton = () => (
  <div className="skeleton" style={{ width: '100%', height: '80vh', borderRadius: 0 }}></div>
);
