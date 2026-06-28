import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Heart, ShoppingCart, Minus, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import PriceDisplay from '../components/PriceDisplay';
import StockBadge from '../components/StockBadge';
import ProductImageGallery from '../components/ProductImageGallery';
import ProductDescription from '../components/ProductDescription';
import VariantSelector from '../components/VariantSelector';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});

  const isVariable = product?.productType === 'variable' && product?.variantOptions?.length > 0;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.getProduct(id);
        setProduct(res);

        if (res.productType === 'variable' && res.variantOptions?.length > 0) {
          const autoSelected = {};
          res.variantOptions.forEach(opt => {
            if (opt.values.length === 1) {
              autoSelected[opt.name] = opt.values[0];
            }
          });
          setSelectedOptions(autoSelected);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const selectedVariant = useMemo(() => {
    if (!isVariable || !product?.variants) return null;
    const optionNames = product.variantOptions.map(o => o.name);
    const allSelected = optionNames.every(name => selectedOptions[name]);
    if (!allSelected) return null;

    return product.variants.find(v => {
      if (!v.isActive) return false;
      const optVals = v.optionValues instanceof Map
        ? Object.fromEntries(v.optionValues)
        : v.optionValues || {};
      return optionNames.every(name => optVals[name] === selectedOptions[name]);
    }) || null;
  }, [isVariable, product, selectedOptions]);

  const displayPrice = isVariable && selectedVariant
    ? selectedVariant.price
    : product?.price;

  const displayDiscountPrice = isVariable && selectedVariant
    ? selectedVariant.salePrice
    : product?.discountPrice;

  const displayStock = isVariable && selectedVariant
    ? selectedVariant.stock
    : isVariable
      ? (product?.totalStock ?? 0)
      : (product?.stock ?? 0);

  const displayDeliveryCharge = isVariable && selectedVariant
    ? (selectedVariant.deliveryCharge != null ? selectedVariant.deliveryCharge : product?.deliveryCharge)
    : product?.deliveryCharge;

  const displayImages = useMemo(() => {
    if (isVariable && selectedVariant && selectedVariant.images?.length > 0) {
      return selectedVariant.images;
    }
    return product?.images || (product?.image ? [product.image] : []);
  }, [isVariable, selectedVariant, product]);

  const isOutOfStock = displayStock <= 0;
  const needsSelection = isVariable && !selectedVariant;

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
    setQuantity(1);
  };

  const handleQuantityChange = (type) => {
    if (type === 'inc') {
      if (quantity < displayStock) {
        setQuantity(prev => prev + 1);
      }
    } else if (type === 'dec' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (needsSelection) {
      showToast.error('Please select all options');
      return;
    }
    if (isOutOfStock) {
      showToast.error('This product is out of stock');
      return;
    }

    const cartVariant = isVariable && selectedVariant ? {
      variantId: selectedVariant._id,
      variantOptions: selectedOptions,
      price: selectedVariant.price,
      salePrice: selectedVariant.salePrice,
      stock: selectedVariant.stock,
      images: selectedVariant.images,
      deliveryCharge: selectedVariant.deliveryCharge != null
        ? selectedVariant.deliveryCharge
        : product.deliveryCharge,
    } : null;

    const success = addToCart(product, quantity, cartVariant);
    if (success !== false) {
      showToast.success('Added to cart!');
    } else {
      showToast.error('Cannot add more than available stock');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (needsSelection) {
      showToast.error('Please select all options');
      return;
    }
    if (isOutOfStock) {
      showToast.error('This product is out of stock');
      return;
    }

    const cartVariant = isVariable && selectedVariant ? {
      variantId: selectedVariant._id,
      variantOptions: selectedOptions,
      price: selectedVariant.price,
      salePrice: selectedVariant.salePrice,
      stock: selectedVariant.stock,
      images: selectedVariant.images,
      deliveryCharge: selectedVariant.deliveryCharge != null
        ? selectedVariant.deliveryCharge
        : product.deliveryCharge,
    } : null;

    addToCart(product, quantity, cartVariant);
    navigate('/checkout');
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

  const effectivePrice = displayDiscountPrice && displayDiscountPrice > 0 && displayDiscountPrice < displayPrice
    ? displayDiscountPrice : displayPrice;

  return (
    <div className="product-detail-page">
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
            images={displayImages}
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

            {isVariable && !selectedVariant ? (
              <PriceDisplay price={product.minPrice} discountPrice={null} size="lg" isRange={true} />
            ) : (
              <PriceDisplay price={displayPrice} discountPrice={displayDiscountPrice} size="lg" />
            )}

            {isVariable && (
              <VariantSelector
                variantOptions={product.variantOptions}
                variants={product.variants}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
              />
            )}

            <div className="product-delivery-info" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-bg-alt, #f9f9f9)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span className="text-muted">Product Price</span>
                <span>{needsSelection ? '—' : `৳${Number(effectivePrice).toLocaleString()}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '4px' }}>
                <span className="text-muted">Delivery Charge</span>
                <span>
                  {needsSelection ? '—' : Number(displayDeliveryCharge) > 0
                    ? `৳${Number(displayDeliveryCharge).toLocaleString()}`
                    : <span style={{ color: 'var(--color-success)' }}>Free</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--color-border)' }}>
                <span>Total Payable</span>
                <span className="text-accent">
                  {needsSelection ? '—' : `৳${(Number(effectivePrice) + Number(displayDeliveryCharge || 0)).toLocaleString()}`}
                </span>
              </div>
            </div>

            <StockBadge stock={displayStock} />

            <div className="product-detail-desc">
              <ProductDescription description={product.description} />
            </div>

            {!isOutOfStock && !needsSelection && (
              <div className="qty-selector">
                <button className="qty-btn" onClick={() => handleQuantityChange('dec')}><Minus size={16} /></button>
                <input type="number" className="qty-input" value={quantity} readOnly />
                <button className="qty-btn" onClick={() => handleQuantityChange('inc')}><Plus size={16} /></button>
              </div>
            )}

            <div className="product-actions">
              {needsSelection ? (
                <button className="btn btn-secondary btn-lg" disabled style={{ flex: 1, opacity: 0.6 }}>
                  Select Options
                </button>
              ) : !isOutOfStock ? (
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
