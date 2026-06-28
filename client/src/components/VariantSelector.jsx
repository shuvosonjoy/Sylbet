import React from 'react';

const COLOR_MAP = {
  natural: '#D4A574',
  walnut: '#5C4033',
  black: '#222222',
  white: '#FAFAFA',
  brown: '#8B4513',
  red: '#C0392B',
  blue: '#2980B9',
  green: '#27AE60',
  grey: '#7F8C8D',
  gray: '#7F8C8D',
  beige: '#F5E6CC',
  cream: '#FFFDD0',
  mahogany: '#C04000',
  oak: '#C8A96E',
  teak: '#B8860B',
  cherry: '#993333',
  ebony: '#3C2415',
  ivory: '#FFFFF0',
  honey: '#EB9605',
  amber: '#FFBF00',
};

const VariantSelector = ({ variantOptions, variants, selectedOptions, onOptionChange }) => {
  if (!variantOptions || variantOptions.length === 0) return null;

  const isColorOption = (name) => {
    return name.toLowerCase() === 'color' || name.toLowerCase() === 'colour';
  };

  const getColorHex = (colorName) => {
    return COLOR_MAP[colorName.toLowerCase()] || null;
  };

  const isValueAvailable = (optionName, value) => {
    const testSelection = { ...selectedOptions, [optionName]: value };
    return variants.some(v => {
      if (!v.isActive) return false;
      const optVals = v.optionValues instanceof Map
        ? Object.fromEntries(v.optionValues)
        : v.optionValues || {};
      return Object.entries(testSelection).every(([key, val]) => optVals[key] === val);
    });
  };

  const isValueInStock = (optionName, value) => {
    const testSelection = { ...selectedOptions, [optionName]: value };
    return variants.some(v => {
      if (!v.isActive || v.stock <= 0) return false;
      const optVals = v.optionValues instanceof Map
        ? Object.fromEntries(v.optionValues)
        : v.optionValues || {};
      return Object.entries(testSelection).every(([key, val]) => optVals[key] === val);
    });
  };

  return (
    <div className="variant-selectors">
      {variantOptions.map((option) => {
        if (option.values.length === 0) return null;

        const isColor = isColorOption(option.name);

        return (
          <div key={option.name} className="variant-selector">
            <label className="variant-selector-label">
              {option.name}: <span className="variant-selector-value">{selectedOptions[option.name] || 'Select'}</span>
            </label>
            <div className="variant-pills">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.name] === value;
                const available = isValueAvailable(option.name, value);
                const inStock = isValueInStock(option.name, value);
                const colorHex = isColor ? getColorHex(value) : null;

                if (isColor && colorHex) {
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`variant-swatch ${isSelected ? 'active' : ''} ${!available ? 'disabled' : ''} ${!inStock && available ? 'out-of-stock' : ''}`}
                      style={{ '--swatch-color': colorHex }}
                      onClick={() => available && onOptionChange(option.name, value)}
                      disabled={!available}
                      title={value}
                    >
                      <span className="variant-swatch-inner" />
                    </button>
                  );
                }

                return (
                  <button
                    key={value}
                    type="button"
                    className={`variant-pill ${isSelected ? 'active' : ''} ${!available ? 'disabled' : ''} ${!inStock && available ? 'out-of-stock' : ''}`}
                    onClick={() => available && onOptionChange(option.name, value)}
                    disabled={!available}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariantSelector;
