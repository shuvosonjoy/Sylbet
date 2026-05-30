import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { showToast } from '../utils/toast';
import PriceDisplay from './PriceDisplay';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock <= 0) {
      showToast.error('This product is out of stock');
      return;
    }
    const success = addToCart(product, 1);
    if (success !== false) {
      showToast.success('Added to cart');
    } else {
      showToast.error('Cannot add more than available stock');
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast.info('Please login to add to wishlist');
      return;
    }
    try {
      await api.addToWishlist(product._id, token);
      showToast.success('Added to wishlist');
    } catch (err) {
      if (err.message.includes('already')) {
        showToast.info('Already in wishlist');
      } else {
        showToast.error(err.message);
      }
    }
  };

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <Link to={`/product/${product._id}`} className="card product-card card-hover">
      <div className="product-img-wrapper">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
        ) : (
          <div className="img-placeholder">
            {product.name.charAt(0)}
          </div>
        )}
        {hasDiscount && (
          <span className="product-badge product-badge-sale">-{discountPercent}%</span>
        )}
        {isOutOfStock && (
          <div className="product-overlay-out">Out of Stock</div>
        )}
        <div className="product-actions-overlay">
          <button className="product-action-btn" onClick={handleWishlist} aria-label="Add to wishlist">
            <Heart size={18} />
          </button>
          {!isOutOfStock && (
            <button className="product-action-btn" onClick={handleAddToCart} aria-label="Add to cart">
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="product-info">
        <span className="product-category">{product.category?.name || 'Uncategorized'}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-footer">
          <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="md" />
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
