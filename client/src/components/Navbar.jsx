import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const catRef = useRef(null);
  const userRef = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const getSubsForCategory = (catId) => subcategories.filter(s => s.category?._id === catId || s.category === catId);

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-text">Sylbet</span>
        </Link>

        <div className={`nav-links ${mobileMenuOpen ? 'nav-links-open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
          <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Shop</NavLink>

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
                      onClick={() => { setShowCategories(false); setMobileMenuOpen(false); }}
                    >
                      {cat.name}
                    </Link>
                    <div className="mega-items">
                      {getSubsForCategory(cat._id).map(sub => (
                        <Link
                          key={sub._id}
                          to={`/shop?category=${cat._id}&subcategory=${sub._id}`}
                          className="mega-item"
                          onClick={() => { setShowCategories(false); setMobileMenuOpen(false); }}
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

          <div className="nav-actions-mobile">
            {isAuthenticated && (
              <Link to="/wishlist" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
            )}
            {!isAuthenticated ? (
              <Link to="/login" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            ) : (
              <>
                {isAdmin && <Link to="/admin/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>}
                <button className="nav-link nav-link-btn" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        </div>

        <div className="nav-actions">
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

          <button className="nav-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
