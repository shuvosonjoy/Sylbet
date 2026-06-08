import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const ProductImageGallery = ({ images = [], productName = 'Product' }) => {
  const safeImages = images && images.length > 0 ? images.filter(Boolean) : [];
  const hasMultipleImages = safeImages.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  
  // Mobile swipe and zoom states
  const [touchStart, setTouchStart] = useState(null);
  const [lastTap, setLastTap] = useState(0);

  const mainImageRef = useRef(null);
  const containerRef = useRef(null);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [safeImages.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [safeImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!hasMultipleImages) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setIsZoomed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultipleImages, handlePrev, handleNext]);

  // Desktop Zoom Handlers
  const handleMouseMove = (e) => {
    if (!mainImageRef.current) return;
    const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  // Mobile Touch Handlers
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    
    const now = Date.now();
    if (now - lastTap < 300) {
      setIsZoomed(!isZoomed);
      if (isZoomed) {
        setZoomPosition({ x: 50, y: 50 });
      } else {
        setZoomPosition({ x: 50, y: 50 });
      }
    }
    setLastTap(now);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;

    if (isZoomed && mainImageRef.current) {
      e.preventDefault();
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      
      const { width, height } = mainImageRef.current.getBoundingClientRect();
      const dx = touchStart.x - touchX;
      const dy = touchStart.y - touchY;
      
      setZoomPosition(prev => {
        let newX = prev.x + (dx / width) * 100;
        let newY = prev.y + (dy / height) * 100;
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));
        return { x: newX, y: newY };
      });
      
      setTouchStart({ x: touchX, y: touchY });
      return;
    }

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const diffX = touchStart.x - touchEndX;
    const diffY = touchStart.y - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || isZoomed) {
      setTouchStart(null);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStart.x - touchEndX;

    if (Math.abs(diff) > 50 && hasMultipleImages) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStart(null);
  };

  if (safeImages.length === 0) {
    return (
      <div className="product-gallery-placeholder">
        <div className="img-placeholder" style={{ minHeight: '400px', borderRadius: 'var(--radius-lg)' }}>
          {productName.charAt(0)}
        </div>
      </div>
    );
  }

  const activeImage = safeImages[activeIndex];

  return (
    <div className="product-gallery" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Main image on top */}
      <div className="gallery-main">
        {hasMultipleImages && (
          <>
            <button className="gallery-nav gallery-nav-prev" onClick={handlePrev} aria-label="Previous image">
              <ChevronLeft size={24} />
            </button>
            <button className="gallery-nav gallery-nav-next" onClick={handleNext} aria-label="Next image">
              <ChevronRight size={24} />
            </button>
            <div className="gallery-counter">
              {activeIndex + 1} / {safeImages.length}
            </div>
          </>
        )}

        {!isZoomed && (
          <div className="gallery-zoom-hint">
            <ZoomIn size={18} />
          </div>
        )}

        <div
          className={`gallery-main-image-container ${isZoomed ? 'zoomed' : ''}`}
          ref={mainImageRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={isZoomed ? {
            backgroundImage: `url(${activeImage})`,
            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            backgroundSize: '250%'
          } : {}}
        >
          <img
            src={activeImage}
            alt={`${productName} - View ${activeIndex + 1}`}
            loading="eager"
            draggable={false}
            className={`main-image ${isZoomed ? 'hidden-img' : ''}`}
          />
        </div>
      </div>

      {/* Thumbnails below, horizontal row */}
      {hasMultipleImages && (
        <div
          className="gallery-thumbnails"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              className={`gallery-thumb ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => {
                setActiveIndex(idx);
                setIsZoomed(false);
              }}
              aria-label={`View image ${idx + 1}`}
              style={{ flexShrink: 0 }}
            >
              <img src={img} alt={`${productName} thumbnail ${idx + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default ProductImageGallery;
