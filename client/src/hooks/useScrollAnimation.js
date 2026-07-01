import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnimation } from '../context/AnimationContext';

export const useScrollAnimation = (options = {}) => {
  const {
    threshold = 0.15,
    triggerOnce = true,
    rootMargin = '0px 0px -50px 0px',
  } = options;

  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { settings } = useAnimation();

  useEffect(() => {
    if (!settings.animationsEnabled) {
      setIsVisible(true);
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce, rootMargin, settings.animationsEnabled]);

  return { ref, isVisible };
};

export const useStaggerChildren = (itemCount, options = {}) => {
  const { baseDelay = 0.08 } = options;
  const { ref, isVisible } = useScrollAnimation(options);
  const { settings, speedMultiplier } = useAnimation();

  const getStaggerDelay = useCallback(
    (index) => {
      if (!settings.animationsEnabled || !settings.staggerEnabled) return 0;
      return index * baseDelay * speedMultiplier;
    },
    [settings.animationsEnabled, settings.staggerEnabled, baseDelay, speedMultiplier]
  );

  return { ref, isVisible, getStaggerDelay };
};

export const useParallax = (speed = 0.3) => {
  const ref = useRef(null);
  const { settings } = useAnimation();

  useEffect(() => {
    if (!settings.animationsEnabled || !settings.parallaxEnabled) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const element = ref.current;
    if (!element) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const offset = window.scrollY * speed;
          element.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, settings.animationsEnabled, settings.parallaxEnabled]);

  return ref;
};
