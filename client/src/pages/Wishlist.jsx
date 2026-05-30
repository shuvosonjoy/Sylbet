import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';
import PriceDisplay from '../components/PriceDisplay';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const data = await api.getWishlist(token);
      setWishlist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.removeFromWishlist(productId, token);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      showToast.success('Removed from wishlist');
    } catch (err) {
      showToast.error('Failed to remove');
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      showToast.error('Product is out of stock');
      return;
    }
    addToCart(product, 1);
    showToast.success('Added to cart');
  };

  if (loading) return <div className="container section"><div className="spinner"></div></div>;

  return (
    <div className="container section">
      <h1 className="section-title text-center">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="empty-state">
          <h3>Your wishlist is empty</h3>
          <p>Save your favorite items for later</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-4">
          {wishlist.map(product => (
            <div key={product._id} className="card product-card">
              <Link to={`/product/${product._id}`} className="product-img-wrapper">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
                ) : (
                  <div className="img-placeholder">{product.name.charAt(0)}</div>
                )}
              </Link>
              <div className="product-info">
                <span className="product-category">{product.category?.name || 'Uncategorized'}</span>
                <h3 className="product-name">{product.name}</h3>
                <PriceDisplay price={product.price} discountPrice={product.discountPrice} />
                <div className="wishlist-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(product)} disabled={product.stock <= 0}>
                    <ShoppingCart size={16} /> {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemove(product._id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
