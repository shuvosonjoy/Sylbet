import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, Shield, Leaf, Star, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import ImageLightbox from '../components/ImageLightbox';
import { Animated, StaggerContainer } from '../components/Animated';
import { useParallax } from '../hooks/useScrollAnimation';
import { useAnimation } from '../context/AnimationContext';

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

  const [cardStyle, setCardStyle] = useState('woven');

  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const openLightbox = (images, index = 0) => {
    setLightbox({ open: true, images, index });
  };

  const closeLightbox = () => {
    setLightbox({ open: false, images: [], index: 0 });
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const parallaxRef = useParallax(0.15);

  const getItemsToShow = () => {
    return window.innerWidth <= 768 ? 6 : 8;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuredRes, bestRes, subsRes, reviewsRes, cardStyleRes] = await Promise.all([
          api.getProducts({ featured: true, limit: 4 }),
          api.getProducts({ bestSelling: true, limit: 4 }),
          api.getSubcategories(),
          api.getReviews(),
          api.getSetting('categoryCardStyle')
        ]);

        setFeaturedProducts(featuredRes.products || []);
        setBestSelling(bestRes.products || []);
        setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
        if (cardStyleRes?.value) setCardStyle(cardStyleRes.value);

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
        <div className="hero-bg-pattern" ref={parallaxRef} aria-hidden="true"></div>
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

        <button className="slider-nav prev" onClick={prevSlide} aria-label="Previous slide">
          <ChevronLeft size={32} />
        </button>
        <button className="slider-nav next" onClick={nextSlide} aria-label="Next slide">
          <ChevronRight size={32} />
        </button>

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

      {/* Subcategories Section */}
      <section className="section section-light">
        <div className="container">
          <Animated animation="fade-up" as="div" className="section-header">
            <span className="section-tag">Explore</span>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Browse our curated collections of premium cane furniture</p>
          </Animated>

          <StaggerContainer animation="fade-up" className="categories-grid" staggerDelay={0.1}>
            {subcategories.map((subcategory) => (
              <div key={subcategory._id}>
                <Link
                  to={`/shop?subcategory=${subcategory._id}`}
                  className={`category-card category-card-${cardStyle}`}
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
              </div>
            ))}
          </StaggerContainer>

          {allSubcategories.length > getItemsToShow() && (
            <Animated animation="fade-up" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <button
                onClick={handleExpandCategories}
                className="btn btn-secondary"
              >
                {expandedCategories ? 'Show Less' : 'View All Categories'} <ArrowRight size={16} />
              </button>
            </Animated>
          )}
        </div>
      </section>

      {/* Best Selling Products */}
      <section className="section">
        <div className="container">
          <Animated animation="fade-up" as="div" className="section-header">
            <span className="section-tag">Popular</span>
            <h2 className="section-title">Best Selling Products</h2>
            <p className="section-subtitle">Our most loved pieces chosen by customers</p>
          </Animated>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <StaggerContainer animation="fade-up" className="grid grid-cols-4" staggerDelay={0.1}>
              {bestSelling.map((product) => (
                <div key={product._id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="section section-dark">
        <div className="container">
          <Animated animation="fade-up" as="div" className="section-header">
            <span className="section-tag section-tag-light">Curated</span>
            <h2 className="section-title section-title-light">Featured Cane Collection</h2>
            <p className="section-subtitle section-subtitle-light">Handpicked statement pieces for your home</p>
          </Animated>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <StaggerContainer animation="fade-up" className="grid grid-cols-4" staggerDelay={0.1}>
              {featuredProducts.map((product) => (
                <div key={product._id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section">
        <div className="container">
          <Animated animation="fade-up" as="div" className="section-header">
            <span className="section-tag">Why Us</span>
            <h2 className="section-title">Why Choose Sylbet</h2>
            <p className="section-subtitle">We believe in quality, sustainability, and craftsmanship</p>
          </Animated>

          <StaggerContainer animation="fade-up" className="features-grid" staggerDelay={0.12}>
            <div className="feature-card">
              <div className="feature-icon"><Leaf size={32} /></div>
              <h3>Eco-Friendly</h3>
              <p>100% sustainable cane sourced responsibly from nature</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Shield size={32} /></div>
              <h3>Premium Quality</h3>
              <p>Handcrafted by skilled artisans with decades of experience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Truck size={32} /></div>
              <h3>Safe Delivery</h3>
              <p>Carefully packaged and delivered to your doorstep</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Star size={32} /></div>
              <h3>Unique Designs</h3>
              <p>Each piece is one-of-a-kind with authentic artisan touch</p>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Customer Reviews */}
      {reviews.length > 0 && (
      <section className="section section-light">
        <div className="container">
          <Animated animation="fade-up" as="div" className="section-header">
            <span className="section-tag">Reviews</span>
            <h2 className="section-title">What Our Customers Say</h2>
          </Animated>

          <StaggerContainer animation="fade-up" className="testimonials-grid" staggerDelay={0.1}>
            {reviews.map((review) => (
              <div key={review._id} className={`testimonial-card ${review.featured ? 'testimonial-featured' : ''}`}>
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
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>
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
