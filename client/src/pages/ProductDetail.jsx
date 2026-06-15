import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Heart, ShoppingCart, Minus, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import PriceDisplay from '../components/PriceDisplay';
import StockBadge from '../components/StockBadge';
import ProductImageGallery from '../components/ProductImageGallery';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.getProduct(id);
        setProduct(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (type) => {
    if (type === 'inc') {
      if (product && quantity < product.stock) {
        setQuantity(prev => prev + 1);
      }
    } else if (type === 'dec' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      if (product.stock <= 0) {
        showToast.error('This product is out of stock');
        return;
      }
      const success = addToCart(product, quantity);
      if (success !== false) {
        showToast.success('Added to cart!');
      } else {
        showToast.error('Cannot add more than available stock');
      }
    }
  };

  const handleBuyNow = () => {
    if (product) {
      if (product.stock <= 0) {
        showToast.error('This product is out of stock');
        return;
      }
      addToCart(product, quantity);
      navigate('/checkout');
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      showToast.info('Please login to add to wishlist');
      return;
    }
    try {
      await api.addToWishlist(product._id, token);
      showToast.success('Added to wishlist!');
    } catch (err) {
      showToast.info(err.message);
    }
  };

  if (loading) return <div className="container section"><div className="spinner"></div></div>;

  if (!product) return (
    <div className="container section empty-state">
      Product not found. <Link to="/shop" className="text-primary">Back to Shop</Link>
    </div>
  );

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/shop">Shop</Link>
            {product.category && (
              <>
                <ChevronRight size={14} />
                <Link to={`/shop?category=${product.category._id}`}>{product.category.name}</Link>
              </>
            )}
            {product.subcategory && (
              <>
                <ChevronRight size={14} />
                <Link to={`/shop?category=${product.category._id}&subcategory=${product.subcategory._id}`}>
                  {product.subcategory.name}
                </Link>
              </>
            )}
            <ChevronRight size={14} />
            <span>{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="product-detail-grid">
          <ProductImageGallery 
            images={product.images || (product.image ? [product.image] : [])} 
            productName={product.name} 
          />

          <div className="product-detail-info">
            <div className="product-detail-meta">
              {product.category && (
                <Link to={`/shop?category=${product.category._id}`} className="product-detail-category">
                  {product.category.name}
                </Link>
              )}
              {product.subcategory && (
                <span className="product-detail-subcategory">{product.subcategory.name}</span>
              )}
            </div>

            <h1 className="product-detail-title">{product.name}</h1>

            <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="lg" />

            {/* Delivery charge breakdown — shown for every product, including the
                "free delivery" case where deliveryCharge is 0. */}
            <div className="product-delivery-info" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-bg-alt, #f9f9f9)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span className="text-muted">Product Price</span>
                <span>৳{Number(product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '4px' }}>
                <span className="text-muted">Delivery Charge</span>
                <span>
                  {Number(product.deliveryCharge) > 0
                    ? `৳${Number(product.deliveryCharge).toLocaleString()}`
                    : <span style={{ color: 'var(--color-success)' }}>Free</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--color-border)' }}>
                <span>Total Payable</span>
                <span className="text-accent">
                  ৳{(
                    Number(product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price) +
                    Number(product.deliveryCharge || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <StockBadge stock={product.stock} />

            <div className="product-detail-desc">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {!isOutOfStock && (
              <div className="qty-selector">
                <button className="qty-btn" onClick={() => handleQuantityChange('dec')}><Minus size={16} /></button>
                <input type="number" className="qty-input" value={quantity} readOnly />
                <button className="qty-btn" onClick={() => handleQuantityChange('inc')}><Plus size={16} /></button>
              </div>
            )}

            <div className="product-actions">
              {!isOutOfStock ? (
                <>
                  <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 1 }}>
                    <ShoppingCart size={18} /> Add to Cart
                  </button>
                  <button className="btn btn-accent btn-lg" onClick={handleBuyNow} style={{ flex: 1 }}>
                    Buy Now
                  </button>
                </>
              ) : (
                <button className="btn btn-secondary btn-lg" disabled style={{ flex: 1, opacity: 0.6 }}>
                  Out of Stock
                </button>
              )}
              <button className="btn btn-outline-icon" onClick={handleWishlist} aria-label="Add to wishlist">
                <Heart size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
