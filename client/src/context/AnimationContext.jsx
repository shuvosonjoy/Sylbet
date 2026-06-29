import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const defaultSettings = {
  animationsEnabled: true,
  animationSpeed: 'normal',
  staggerEnabled: true,
  parallaxEnabled: true,
  smoothScrollEnabled: true,
};

const speedMap = {
  slow: 1.4,
  normal: 1,
  fast: 0.6,
};

const AnimationContext = createContext({
  settings: defaultSettings,
  speedMultiplier: 1,
  updateSettings: () => {},
});

export const useAnimation = () => useContext(AnimationContext);

export const AnimationProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getSetting('animationSettings')
      .then(res => {
        if (res?.value && typeof res.value === 'object') {
          setSettings(prev => ({ ...prev, ...res.value }));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (settings.smoothScrollEnabled) {
      document.documentElement.style.scrollBehavior = 'smooth';
    } else {
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }, [settings.smoothScrollEnabled, loaded]);

  const speedMultiplier = speedMap[settings.animationSpeed] || 1;

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AnimationContext.Provider value={{ settings, speedMultiplier, updateSettings }}>
      {children}
    </AnimationContext.Provider>
  );
};
