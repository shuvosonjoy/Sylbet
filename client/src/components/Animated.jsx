import React, { useMemo } from 'react';
import { useScrollAnimation, useStaggerChildren } from '../hooks/useScrollAnimation';
import { useAnimation } from '../context/AnimationContext';

const animationStyles = {
  'fade-up': {
    hidden: { opacity: 0, transform: 'translate3d(0, 30px, 0)' },
    visible: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'fade-down': {
    hidden: { opacity: 0, transform: 'translate3d(0, -20px, 0)' },
    visible: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'zoom-in': {
    hidden: { opacity: 0, transform: 'scale(1.08)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  'scale-up': {
    hidden: { opacity: 0, transform: 'scale(0.95)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  'slide-left': {
    hidden: { opacity: 0, transform: 'translate3d(-30px, 0, 0)' },
    visible: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'slide-right': {
    hidden: { opacity: 0, transform: 'translate3d(30px, 0, 0)' },
    visible: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
};

const durationMap = {
  'fade-up': 0.7,
  'fade-in': 0.6,
  'fade-down': 0.6,
  'zoom-in': 0.8,
  'scale-up': 0.6,
  'slide-left': 0.7,
  'slide-right': 0.7,
};

const Animated = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration,
  as: Component = 'div',
  className = '',
  style: extraStyle = {},
  ...props
}) => {
  const { ref, isVisible } = useScrollAnimation();
  const { settings, speedMultiplier } = useAnimation();

  const baseDuration = duration || durationMap[animation] || 0.6;
  const finalDuration = baseDuration * speedMultiplier;
  const preset = animationStyles[animation] || animationStyles['fade-up'];

  const computedStyle = useMemo(() => {
    if (!settings.animationsEnabled) {
      return { ...extraStyle };
    }

    const state = isVisible ? preset.visible : preset.hidden;
    return {
      ...extraStyle,
      ...state,
      transition: `opacity ${finalDuration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${finalDuration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      willChange: isVisible ? 'auto' : 'opacity, transform',
    };
  }, [isVisible, settings.animationsEnabled, preset, finalDuration, delay, extraStyle]);

  return (
    <Component ref={ref} className={className} style={computedStyle} {...props}>
      {children}
    </Component>
  );
};

const StaggerContainer = ({
  children,
  animation = 'fade-up',
  staggerDelay = 0.08,
  as: Component = 'div',
  className = '',
  style: extraStyle = {},
  ...props
}) => {
  const childCount = React.Children.count(children);
  const { ref, isVisible, getStaggerDelay } = useStaggerChildren(childCount, {
    baseDelay: staggerDelay,
  });
  const { settings, speedMultiplier } = useAnimation();

  const baseDuration = durationMap[animation] || 0.6;
  const finalDuration = baseDuration * speedMultiplier;
  const preset = animationStyles[animation] || animationStyles['fade-up'];

  return (
    <Component ref={ref} className={className} style={extraStyle} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const delay = getStaggerDelay(index);
        const state = isVisible ? preset.visible : preset.hidden;
        const childStyle = settings.animationsEnabled
          ? {
              ...state,
              transition: `opacity ${finalDuration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${finalDuration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
              willChange: isVisible ? 'auto' : 'opacity, transform',
            }
          : {};

        return React.cloneElement(child, {
          style: { ...child.props.style, ...childStyle },
        });
      })}
    </Component>
  );
};

export { Animated, StaggerContainer };
export default Animated;
