import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Truck, Shield, Leaf, Star } from 'lucide-react';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

// Slider data – change images as needed
const heroSlides = [
  {
    id: 1,
    image: '/banner1.jpg',
    tag: 'Handcrafted with Love',
    title: 'Elevate Your Space with <span class="hero-highlight">Natural Cane</span> Elegance',
    subtitle: 'Discover our premium collection of handcrafted cane furniture — where timeless design meets sustainable artistry.',
    primaryLink: '/shop',
    primaryText: 'Shop Collection',
    secondaryLink: '/shop?featured=true',
    secondaryText: 'Featured Pieces'
  },
  {
    id: 2,
    image: '/banner2.jpg',
    tag: 'Sustainable & Eco‑Friendly',
    title: 'Embrace Nature with <span class="hero-highlight">Eco‑Cane</span> Furniture',
    subtitle: 'Responsibly sourced materials, exquisite craftsmanship – a greener choice for your home.',
    primaryLink: '/shop?eco=true',
    primaryText: 'Explore Eco',
    secondaryLink: '/shop',
    secondaryText: 'All Products'
  },
  {
    id: 3,
    image: '/banner3.jpg',
    tag: 'Limited Edition',
    title: 'Artisanal <span class="hero-highlight">Masterpieces</span> Just for You',
    subtitle: 'Each piece tells a story of skilled hands and timeless design – truly one of a kind.',
    primaryLink: '/shop',
    primaryText: 'Shop Now',
    secondaryLink: '/shop?featured=true',
    secondaryText: 'Featured'
  }
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [loading, setLoading] = useState(true);

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const getItemsToShow = () => {
    return window.innerWidth <= 768 ? 6 : 8;
  };

  // Fetch data - only once on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuredRes, bestRes, subsRes] = await Promise.all([
          api.getProducts({ featured: true, limit: 4 }),
          api.getProducts({ bestSelling: true, limit: 4 }),
          api.getSubcategories()
        ]);

        const featuredProducts = featuredRes.products || [];
        const bestSelling = bestRes.products || [];

        setFeaturedProducts(featuredProducts);
        setBestSelling(bestSelling);

        if (subsRes && subsRes.length > 0) {
          setAllSubcategories(subsRes);
          const itemsToShow = getItemsToShow();
          setSubcategories(subsRes.slice(0, itemsToShow));
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExpandCategories = () => {
    if (expandedCategories) {
      const itemsToShow = getItemsToShow();
      setSubcategories(allSubcategories.slice(0, itemsToShow));
      setExpandedCategories(false);
    } else {
      setSubcategories(allSubcategories);
      setExpandedCategories(true);
    }
  };

  // Handle window resize to adjust items shown
  useEffect(() => {
    const handleResize = () => {
      if (!expandedCategories && allSubcategories.length > 0) {
        const itemsToShow = getItemsToShow();
        setSubcategories(allSubcategories.slice(0, itemsToShow));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [expandedCategories, allSubcategories]);

  // Auto‑slide logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % heroSlides.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div className="home-page">
      {/* Hero Slider Section */}
      <section 
        className="hero hero-slider"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="hero-bg-pattern"></div>
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <div className="container hero-content">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={index === currentSlide ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8 }}
                className="hero-text"
              >
                <span className="hero-tag">{slide.tag}</span>
                <h1 
                  className="hero-title"
                  dangerouslySetInnerHTML={{ __html: slide.title }}
                />
                <p className="hero-subtitle">{slide.subtitle}</p>
                <div className="hero-buttons">
                  <Link to={slide.primaryLink} className="btn btn-accent btn-lg">
                    {slide.primaryText} <ArrowRight size={18} />
                  </Link>
                  <Link to={slide.secondaryLink} className="btn btn-outline-light btn-lg">
                    {slide.secondaryText}
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={index === currentSlide ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hero-visual"
              >
                <div className="hero-image-card">
                  <img
                    src={slide.image}
                    alt="Sylbets Cane Furniture"
                    className="hero-banner-image"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button className="slider-nav prev" onClick={prevSlide} aria-label="Previous slide">
          <ChevronLeft size={32} />
        </button>
        <button className="slider-nav next" onClick={nextSlide} aria-label="Next slide">
          <ChevronRight size={32} />
        </button>

        {/* Dots indicator */}
        <div className="slider-dots">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              className={`slider-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Subcategories Section (Heading still "Shop by Category") */}
      <motion.section
        className="section section-light"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="container">
          <motion.div className="section-header" variants={fadeUp}>
            <span className="section-tag">Explore</span>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Browse our curated collections of premium cane furniture</p>
          </motion.div>

          <motion.div className="categories-grid" variants={stagger}>
            {subcategories.map((subcategory) => (
              <motion.div key={subcategory._id} variants={fadeUp}>
                <Link
                  to={`/shop?subcategory=${subcategory._id}`}   // link directly to subcategory
                  className="category-card"
                >
                  <div className="category-card-icon" style={{ overflow: 'hidden', padding: 0 }}>
                    {subcategory.image ? (
                      <img
                        src={subcategory.image}
                        alt={subcategory.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          const existing = parent.querySelector('.category-fallback');
                          if (existing) existing.remove();
                          const fallback = document.createElement('div');
                          fallback.className = 'category-fallback';
                          fallback.textContent = subcategory.name.charAt(0);
                          parent.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary-dark)', backgroundColor: 'linear-gradient(135deg, rgba(4,57,39,0.08), rgba(4,57,39,0.04))' }}>
                        {subcategory.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="category-card-title">{subcategory.name}</h3>
                  <p className="category-card-desc">
                    {subcategory.description || 'Discover our beautiful collection'}
                  </p>
                  <span className="category-card-link">
                    Explore <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {allSubcategories.length > getItemsToShow() && (
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <button
                onClick={handleExpandCategories}
                className="btn btn-secondary"
              >
                {expandedCategories ? 'Show Less' : 'View All Categories'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </motion.section>

      {/* Best Selling Products */}
      <motion.section
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="container">
          <motion.div className="section-header" variants={fadeUp}>
            <span className="section-tag">Popular</span>
            <h2 className="section-title">Best Selling Products</h2>
            <p className="section-subtitle">Our most loved pieces chosen by customers</p>
          </motion.div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <motion.div className="grid grid-cols-4" variants={stagger}>
              {bestSelling.map(product => (
                <motion.div key={product._id} variants={fadeUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="section-cta">
            <Link to="/shop?sort=bestSelling" className="btn btn-secondary">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Featured Collection */}
      <motion.section
        className="section section-dark"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="container">
          <motion.div className="section-header" variants={fadeUp}>
            <span className="section-tag section-tag-light">Curated</span>
            <h2 className="section-title section-title-light">Featured Cane Collection</h2>
            <p className="section-subtitle section-subtitle-light">Handpicked statement pieces for your home</p>
          </motion.div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <motion.div className="grid grid-cols-4" variants={stagger}>
              {featuredProducts.map(product => (
                <motion.div key={product._id} variants={fadeUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        className="section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="container">
          <motion.div className="section-header" variants={fadeUp}>
            <span className="section-tag">Why Us</span>
            <h2 className="section-title">Why Choose Sylbet</h2>
            <p className="section-subtitle">We believe in quality, sustainability, and craftsmanship</p>
          </motion.div>

          <motion.div className="features-grid" variants={stagger}>
            <motion.div className="feature-card" variants={fadeUp}>
              <div className="feature-icon"><Leaf size={32} /></div>
              <h3>Eco-Friendly</h3>
              <p>100% sustainable cane sourced responsibly from nature</p>
            </motion.div>
            <motion.div className="feature-card" variants={fadeUp}>
              <div className="feature-icon"><Shield size={32} /></div>
              <h3>Premium Quality</h3>
              <p>Handcrafted by skilled artisans with decades of experience</p>
            </motion.div>
            <motion.div className="feature-card" variants={fadeUp}>
              <div className="feature-icon"><Truck size={32} /></div>
              <h3>Safe Delivery</h3>
              <p>Carefully packaged and delivered to your doorstep</p>
            </motion.div>
            <motion.div className="feature-card" variants={fadeUp}>
              <div className="feature-icon"><Star size={32} /></div>
              <h3>Unique Designs</h3>
              <p>Each piece is one-of-a-kind with authentic artisan touch</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        className="section section-light"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <div className="container">
          <motion.div className="section-header" variants={fadeUp}>
            <span className="section-tag">Reviews</span>
            <h2 className="section-title">What Our Customers Say</h2>
          </motion.div>

          <motion.div className="testimonials-grid" variants={stagger}>
            {[
              { name: 'Fatima Rahman', text: 'The cane lounge chair is absolutely stunning. The craftsmanship is exceptional and it fits perfectly in my living room.', rating: 5 },
              { name: 'Arif Hossain', text: 'Ordered the pendant light and coffee table. Both arrived in perfect condition. Amazing quality for the price!', rating: 5 },
              { name: 'Nusrat Jahan', text: 'Love the eco-friendly approach. The baskets are beautiful and very functional. Will definitely order again.', rating: 4 }
            ].map((review, i) => (
              <motion.div key={i} className="testimonial-card" variants={fadeUp}>
                <div className="testimonial-stars">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="testimonial-text">"{review.text}"</p>
                <p className="testimonial-author">{review.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Banner */}
      <motion.section
        className="section section-cta-banner"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <div className="container text-center">
          <h2 className="cta-title">Ready to Transform Your Space?</h2>
          <p className="cta-subtitle">Explore our full collection of handcrafted cane furniture</p>
          <Link to="/shop" className="btn btn-accent btn-lg">
            Shop Now <ArrowRight size={18} />
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;