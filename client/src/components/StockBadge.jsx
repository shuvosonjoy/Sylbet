import React from 'react';

const StockBadge = ({ stock }) => {
  if (stock <= 0) {
    return <span className="stock-badge stock-out">Out of Stock</span>;
  }
  if (stock <= 5) {
    return <span className="stock-badge stock-low">Low Stock ({stock} left)</span>;
  }
  return <span className="stock-badge stock-in">In Stock</span>;
};

export default StockBadge;
