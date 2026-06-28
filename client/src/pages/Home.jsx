import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, Shield, Leaf, Star, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import ImageLightbox from '../components/ImageLightbox';

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
    image: '/sylbet_banner1.jpg',
    tag: 'Handmade, Heartmade',
    title: 'Discover <span class="hero-highlight">Natural Cane</span> Elegance',
    subtitle: 'Timeless craftsmanship for modern homes.'
  },
  {
    id: 2,
    image: '/sylbet_banner2.jpg',
    tag: 'Sustainable & Eco-Friendly',
    title: '<span class="hero-highlight">Eco-Cane</span> for Modern Living',
    subtitle: 'Responsibly crafted furniture for a sustainable lifestyle.'
  },
  {
    id: 3,
    image: '/sylbet_banner3.png',
    tag: 'Custom Crafted',
    title: 'Artisanal <span class="hero-highlight">Masterpieces</span> Just for You',
    subtitle: 'Each piece tells a story of skilled hands and timeless design – truly one of a kind.'
  }
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  // Lightbox state
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const openLightbox = (images, index = 0) => {
    setLightbox({ open: true, images, index });
  };

  const closeLightbox = () => {
    setLightbox({ open: false, images: [], index: 0 });
  };

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
        const [featuredRes, bestRes, subsRes, reviewsRes] = await Promise.all([
          api.getProducts({ featured: true, limit: 4 }),
          api.getProducts({ bestSelling: true, limit: 4 }),
          api.getSubcategories(),
          api.getReviews()
        ]);

        const featuredProducts = featuredRes.products || [];
        const bestSelling = bestRes.products || [];

        console.log('[DEBUG] Best Selling products received from API:', bestSelling);
        console.log('[DEBUG] Featured products received from API:', featuredProducts);

        setFeaturedProducts(featuredProducts);
        setBestSelling(bestSelling);
        setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);

        if (subsRes && subsRes.length > 0) {
          console.log('[DEBUG] Category data received from API:', subsRes);
          setAllSubcategories(subsRes);
          const itemsToShow = getItemsToShow();
          const initialSubcategories = subsRes.slice(0, itemsToShow);
          console.log('[DEBUG] Initial subcategories to render:', initialSubcategories);
          setSubcategories(initialSubcategories);
        } else {
          console.log('[DEBUG] No subcategories received from API.');
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
      const collapsed = allSubcategories.slice(0, itemsToShow);
      console.log('[DEBUG] "Show More" collapsed. Resetting subcategories to:', collapsed);
      setSubcategories(collapsed);
      setExpandedCategories(false);
    } else {
      console.log('[DEBUG] "Show More" expanded. Appended/All subcategories data:', allSubcategories);
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
        <div className="hero-bg-pattern" aria-hidden="true"></div>
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
                <h1 
                  className="hero-title"
                  dangerouslySetInnerHTML={{ __html: slide.title }}
                />
                <p className="hero-subtitle">{slide.subtitle}</p>
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
                    alt="Sylbet"
                    className="hero-banner-image"
                  />
                  <span className="hero-tag hero-tag-overlay">{slide.tag}</span>
                  <Link to="/shop" className="hero-shop-btn">
                    Shop Now <ArrowRight size={16} />
                  </Link>
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
        layout
      >
        <div className="container">
          <motion.div className="section-header" variants={fadeUp}>
            <span className="section-tag">Explore</span>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Browse our curated collections of premium cane furniture</p>
          </motion.div>

          <motion.div className="categories-grid" variants={stagger} layout>
            {subcategories.map((subcategory, index) => {
              console.log(`[DEBUG] Rendering Category Card - Index: ${index}, ID: ${subcategory._id}, Name: ${subcategory.name}, Image URL: ${subcategory.image}, Description: ${subcategory.description}`);
              return (
                <motion.div
                  key={subcategory._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
                >
                  <Link
                    to={`/shop?subcategory=${subcategory._id}`}
                    className="category-card"
                  >
                    <div className="category-card-image">
                      {subcategory.image ? (
                        <img
                          src={subcategory.image}
                          alt={subcategory.name}
                          className="category-card-img"
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
                        <div className="category-fallback">
                          {subcategory.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="category-card-title">{subcategory.name}</h3>
                  </Link>
                </motion.div>
              );
            })}
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
            <motion.div className="grid grid-cols-4" variants={stagger} layout>
              {bestSelling.map((product, index) => {
                console.log(`[DEBUG] Rendering Best Selling Product Card - Index: ${index}, ID: ${product._id}, Name: ${product.name}, Image URL: ${product.image}, Price: ${product.price}`);
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
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
            <motion.div className="grid grid-cols-4" variants={stagger} layout>
              {featuredProducts.map((product, index) => {
                console.log(`[DEBUG] Rendering Featured Product Card - Index: ${index}, ID: ${product._id}, Name: ${product.name}, Image URL: ${product.image}, Price: ${product.price}`);
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: (index % 4) * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                );
              })}
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

      {/* Customer Reviews */}
      {reviews.length > 0 && (
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
            {reviews.map((review, i) => (
              <motion.div key={review._id} className={`testimonial-card ${review.featured ? 'testimonial-featured' : ''}`} variants={fadeUp}>
                <div className="testimonial-stars">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                  {Array.from({ length: 5 - review.rating }).map((_, j) => (
                    <Star key={`empty-${j}`} size={16} />
                  ))}
                </div>
                <p className="testimonial-text">"{review.text}"</p>

                {review.images && review.images.length > 0 && (
                  <div className="testimonial-images">
                    {review.images.map((img, imgIdx) => (
                      <button
                        key={imgIdx}
                        className="testimonial-image-thumb"
                        onClick={() => openLightbox(review.images, imgIdx)}
                        type="button"
                      >
                        <img src={img} alt={`Review by ${review.customerName}`} loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="testimonial-author-info">
                  <p className="testimonial-author">{review.customerName}</p>
                  {review.location && (
                    <p className="testimonial-location">{review.location}</p>
                  )}
                </div>

                {review.product?.name && (
                  <Link to={`/product/${review.product._id}`} className="testimonial-product-ref">
                    {review.product.name}
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
      )}

      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={closeLightbox}
          onPrev={lightbox.index > 0 ? () => setLightbox(prev => ({ ...prev, index: prev.index - 1 })) : null}
          onNext={lightbox.index < lightbox.images.length - 1 ? () => setLightbox(prev => ({ ...prev, index: prev.index + 1 })) : null}
        />
      )}
    </div>
  );
};

export default Home;