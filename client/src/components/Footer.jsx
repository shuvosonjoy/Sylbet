import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-logo">Sylbets</h3>
            <p className="footer-desc">
              Handcrafted Cane Elegance. Bringing nature's warmth and beauty to your home with premium sustainable craftsmanship.
            </p>
          </div>
          <div>
            <h4 className="footer-title">Quick Links</h4>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/shop">Shop Collection</Link>
              <Link to="/cart">Cart</Link>
            </div>
          </div>
          <div>
            <h4 className="footer-title">Categories</h4>
            <div className="footer-links">
              <Link to="/shop">All Products</Link>
              <Link to="/shop?featured=true">Featured Items</Link>
            </div>
          </div>
          <div>
            <h4 className="footer-title">Contact Us</h4>
            <div className="footer-links">
              <a href="https://web.facebook.com/sylbets" target="_blank" rel="noopener noreferrer">Facebook Page</a>
              <span className="footer-contact-item"><Phone size={14} /> +880 1XXX-XXXXXX</span>
              <span className="footer-contact-item"><Mail size={14} /> info@sylbets.com</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Sylbets. All rights reserved. Handcrafted with love in Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
