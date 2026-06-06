import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Settings, Search, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Expandable categories state
  const [expandedCategories, setExpandedCategories] = useState({});

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuSearchQuery, setMobileMenuSearchQuery] = useState('');

  const catRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const [cats, subs] = await Promise.all([
          api.getCategories(),
          api.getSubcategories()
        ]);
        setCategories(cats);
        setSubcategories(subs);
      } catch (e) { /* silent */ }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setShowCategories(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.getProducts({ search: searchQuery, limit: 5 });
        setSearchResults(res.products || []);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setShowSearchResults(false);
    setShowUserMenu(false);
    setShowCategories(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const getSubsForCategory = (catId) =>
    subcategories.filter(s => s.category?._id === catId || s.category === catId);

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container nav-container-wrapper">

        {/* MOBILE LAYOUT HEADER */}
        <div className="nav-mobile-header">
          <button
            className="nav-mobile-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="nav-logo-mobile">
            <img
              src="/sylbet_logo_v1.png"
              alt="Sylbet"
              className="logo-image"
            />
          
            <span className="logo-text">SYLBET</span>
          </Link>

          <div className="nav-mobile-actions">
            <button
              className="nav-mobile-btn"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle search"
            >
              {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <Link to="/cart" className="nav-mobile-btn cart-icon-wrapper" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="nav-desktop-layout">
          {/* 1. Left Section - Navigation Links */}
          <div className="nav-left">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
            <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Shop</NavLink>

            <div className="nav-dropdown" ref={catRef}>
              <button className="nav-link nav-link-btn" onClick={() => setShowCategories(!showCategories)}>
                Categories <ChevronDown size={14} />
              </button>
              {showCategories && (
                <div className="dropdown-mega">
                  {categories.map(cat => (
                    <div key={cat._id} className="mega-col">
                      <Link
                        to={`/shop?category=${cat._id}`}
                        className="mega-title"
                        onClick={() => setShowCategories(false)}
                      >
                        {cat.name}
                      </Link>
                      <div className="mega-items">
                        {getSubsForCategory(cat._id).map(sub => (
                          <Link
                            key={sub._id}
                            to={`/shop?category=${cat._id}&subcategory=${sub._id}`}
                            className="mega-item"
                            onClick={() => setShowCategories(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Center Section - Logo */}
          <div className="nav-center">
            
            <Link to="/" className="nav-logo">
             <img
              src="/sylbet_logo_v1.png"
              alt="Sylbet"
              className="logo-image"
            />
              <span className="logo-text">SYLBET</span>
            </Link>
          </div>

          {/* 3. Right Section - Search & Actions */}
          <div className="nav-right">
            {/* Search Input */}
            <div className="nav-search-container" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="nav-search-form">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  className="nav-search-input"
                />
                {searchLoading && <Loader size={14} className="search-loader-icon spinner-fast" />}
              </form>

              {/* Real-time Search Results Dropdown */}
              {showSearchResults && searchQuery.trim().length >= 2 && (
                <div className="search-results-dropdown">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="search-results-list">
                        {searchResults.map(prod => (
                          <Link
                            key={prod._id}
                            to={`/product/${prod._id}`}
                            className="search-result-item"
                            onClick={() => setShowSearchResults(false)}
                          >
                            <div className="search-result-img-wrapper">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="search-result-img" />
                              ) : (
                                <div className="search-result-img-placeholder">
                                  {prod.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="search-result-info">
                              <span className="search-result-name">{prod.name}</span>
                              <span className="search-result-price">
                                {prod.discountPrice ? (
                                  <>
                                    <span className="current">৳{prod.discountPrice}</span>
                                    <span className="original">৳{prod.price}</span>
                                  </>
                                ) : (
                                  <span>৳{prod.price}</span>
                                )}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Link
                        to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                        className="search-results-view-all"
                        onClick={() => setShowSearchResults(false)}
                      >
                        See all results for "{searchQuery}"
                      </Link>
                    </>
                  ) : (
                    <div className="search-results-empty">
                      {searchLoading ? 'Searching...' : `No results found for "${searchQuery}"`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="nav-action-buttons">
              {isAuthenticated && (
                <Link to="/wishlist" className="nav-icon-btn" aria-label="Wishlist">
                  <Heart size={20} />
                </Link>
              )}

              <Link to="/cart" className="nav-icon-btn cart-icon-wrapper" aria-label="Cart">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>

              {!isAuthenticated ? (
                <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
              ) : (
                <div className="nav-dropdown" ref={userRef}>
                  <button className="nav-icon-btn" onClick={() => setShowUserMenu(!showUserMenu)} aria-label="User menu">
                    <User size={20} />
                  </button>
                  {showUserMenu && (
                    <div className="dropdown-menu dropdown-right">
                      <div className="dropdown-header">
                        <p className="dropdown-user-name">{user.name}</p>
                        <p className="dropdown-user-email">{user.email}</p>
                      </div>
                      {isAdmin && (
                        <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <Settings size={16} /> Admin Panel
                        </Link>
                      )}
                      <Link to="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        My Orders
                      </Link>
                      <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE EXPANDED SEARCH */}
        {mobileSearchOpen && (
          <div className="nav-mobile-search-bar">
            <form onSubmit={handleSearchSubmit} className="nav-mobile-search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="nav-mobile-search-input"
              />
              <button type="submit" className="btn btn-primary btn-sm">Go</button>
            </form>

            {searchQuery.trim().length >= 2 && (
              <div className="search-results-dropdown-mobile">
                {searchResults.length > 0 ? (
                  <>
                    <div className="search-results-list">
                      {searchResults.map(prod => (
                        <Link
                          key={prod._id}
                          to={`/product/${prod._id}`}
                          className="search-result-item"
                          onClick={() => {
                            setShowSearchResults(false);
                            setMobileSearchOpen(false);
                          }}
                        >
                          <div className="search-result-img-wrapper">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="search-result-img" />
                            ) : (
                              <div className="search-result-img-placeholder">
                                {prod.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="search-result-info">
                            <span className="search-result-name">{prod.name}</span>
                            <span className="search-result-price">
                              {prod.discountPrice ? `৳${prod.discountPrice}` : `৳${prod.price}`}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link
                      to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                      className="search-results-view-all"
                      onClick={() => {
                        setShowSearchResults(false);
                        setMobileSearchOpen(false);
                      }}
                    >
                      See all results
                    </Link>
                  </>
                ) : (
                  <div className="search-results-empty">
                    {searchLoading ? 'Searching...' : 'No results found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MOBILE NAVIGATION LINKS MENU */}
        {mobileMenuOpen && (
          <div className="nav-mobile-menu">
            <div className="nav-mobile-links">
              {/* Profile Section - Compact Icons at Top */}
              {isAuthenticated && (
                <div className="nav-mobile-profile-section-top">
                  <div className="nav-mobile-user-info-compact">
                    <span className="user-name-compact">{user.name}</span>
                  </div>
                  <div className="nav-mobile-profile-icons">
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="nav-mobile-icon-btn"
                        onClick={() => setMobileMenuOpen(false)}
                        title="Admin Panel"
                      >
                        <Settings size={20} />
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="nav-mobile-icon-btn"
                      onClick={() => setMobileMenuOpen(false)}
                      title="My Orders"
                    >
                      <ShoppingCart size={20} />
                    </Link>
                    <Link
                      to="/wishlist"
                      className="nav-mobile-icon-btn"
                      onClick={() => setMobileMenuOpen(false)}
                      title="Wishlist"
                    >
                      <Heart size={20} />
                    </Link>
                    <button
                      className="nav-mobile-icon-btn logout-icon-btn"
                      onClick={handleLogout}
                      title="Logout"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <NavLink to="/" className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
              <NavLink to="/shop" className={({ isActive }) => `nav-mobile-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Shop All</NavLink>

              {/* Categories Section - Expandable */}
              <div className="nav-mobile-categories-section">
                <div className="nav-mobile-cat-header">Categories</div>
                {categories.map(cat => {
                  const subs = getSubsForCategory(cat._id);
                  const isExpanded = expandedCategories[cat._id];

                  return (
                    <div key={cat._id} className="nav-mobile-cat-expandable">
                      <div className="nav-mobile-cat-toggle">
                        <Link
                          to={`/shop?category=${cat._id}`}
                          className="nav-mobile-cat-title"
                          onClick={() => {
                            setMobileMenuOpen(false);
                          }}
                        >
                          {cat.name}
                        </Link>
                        {subs.length > 0 && (
                          <button
                            className="nav-mobile-cat-expand-btn"
                            onClick={() => toggleCategoryExpand(cat._id)}
                            aria-label={`Toggle ${cat.name} subcategories`}
                          >
                            <ChevronDown
                              size={18}
                              className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Expandable Subcategories */}
                      {subs.length > 0 && isExpanded && (
                        <div className="nav-mobile-subcat-list-expanded">
                          {subs.map(sub => (
                            <Link
                              key={sub._id}
                              to={`/shop?category=${cat._id}&subcategory=${sub._id}`}
                              className="nav-mobile-subcat-item-expanded"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Login Button - if not authenticated */}
              {!isAuthenticated && (
                <div className="nav-mobile-login-section">
                  <Link to="/login" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                    Login / Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
