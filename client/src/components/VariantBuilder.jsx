import React, { useState } from 'react';
import { Plus, X, Upload, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { showToast } from '../utils/toast';

const generateSKU = (productName, optionValues) => {
  const prefix = (productName || 'PROD').substring(0, 4).toUpperCase().replace(/\s/g, '');
  const suffix = Object.values(optionValues)
    .map(v => v.substring(0, 3).toUpperCase().replace(/\s/g, ''))
    .join('-');
  return `${prefix}-${suffix}`;
};

const cartesian = (arrays) => {
  if (arrays.length === 0) return [[]];
  return arrays.reduce(
    (acc, curr) => acc.flatMap(combo => curr.map(val => [...combo, val])),
    [[]]
  );
};

const VariantBuilder = ({ variantOptions, variants, onChange, productName, token }) => {
  const [tagInputs, setTagInputs] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [bulkField, setBulkField] = useState('price');
  const [bulkValue, setBulkValue] = useState('');

  const updateOptions = (newOptions) => {
    onChange({ variantOptions: newOptions, variants });
  };

  const updateVariants = (newVariants) => {
    onChange({ variantOptions, variants: newVariants });
  };

  const addOptionGroup = () => {
    updateOptions([...variantOptions, { name: '', values: [] }]);
  };

  const removeOptionGroup = (index) => {
    const newOptions = variantOptions.filter((_, i) => i !== index);
    updateOptions(newOptions);
  };

  const updateOptionName = (index, name) => {
    const newOptions = [...variantOptions];
    newOptions[index] = { ...newOptions[index], name };
    updateOptions(newOptions);
  };

  const addOptionValue = (optIndex, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const opt = variantOptions[optIndex];
    if (opt.values.includes(trimmed)) return;
    const newOptions = [...variantOptions];
    newOptions[optIndex] = { ...opt, values: [...opt.values, trimmed] };
    updateOptions(newOptions);
  };

  const removeOptionValue = (optIndex, valIndex) => {
    const newOptions = [...variantOptions];
    newOptions[optIndex] = {
      ...newOptions[optIndex],
      values: newOptions[optIndex].values.filter((_, i) => i !== valIndex)
    };
    updateOptions(newOptions);
  };

  const handleTagKeyDown = (e, optIndex) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInputs[optIndex] || '';
      addOptionValue(optIndex, val);
      setTagInputs({ ...tagInputs, [optIndex]: '' });
    }
  };

  const generateCombinations = () => {
    const validOptions = variantOptions.filter(o => o.name && o.values.length > 0);
    if (validOptions.length === 0) {
      showToast.error('Add at least one option group with values');
      return;
    }

    const combos = cartesian(validOptions.map(o => o.values));
    const existingMap = new Map();
    variants.forEach(v => {
      const key = validOptions.map(o => {
        const val = v.optionValues instanceof Map
          ? v.optionValues.get(o.name)
          : v.optionValues?.[o.name];
        return val || '';
      }).join('|');
      existingMap.set(key, v);
    });

    const newVariants = combos.map(combo => {
      const optionValues = {};
      validOptions.forEach((opt, i) => {
        optionValues[opt.name] = combo[i];
      });
      const key = combo.join('|');
      const existing = existingMap.get(key);
      if (existing) {
        return { ...existing, optionValues };
      }
      return {
        optionValues,
        price: '',
        salePrice: '',
        stock: 0,
        sku: generateSKU(productName, optionValues),
        images: [],
        deliveryCharge: '',
        isActive: true
      };
    });

    updateVariants(newVariants);
    showToast.success(`Generated ${newVariants.length} variant combinations`);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    updateVariants(newVariants);
  };

  const removeVariant = (index) => {
    updateVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (variantIndex, file) => {
    if (!file) return;
    setUploadingFor(variantIndex);
    try {
      const result = await api.uploadImage(file, token);
      const newVariants = [...variants];
      const current = newVariants[variantIndex].images || [];
      newVariants[variantIndex] = {
        ...newVariants[variantIndex],
        images: [...current, result.url]
      };
      updateVariants(newVariants);
    } catch (err) {
      showToast.error('Image upload failed: ' + err.message);
    } finally {
      setUploadingFor(null);
    }
  };

  const removeVariantImage = (variantIndex, imgIndex) => {
    const newVariants = [...variants];
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      images: newVariants[variantIndex].images.filter((_, i) => i !== imgIndex)
    };
    updateVariants(newVariants);
  };

  const applyBulk = () => {
    if (bulkValue === '') return;
    const newVariants = variants.map(v => ({ ...v, [bulkField]: bulkField === 'isActive' ? bulkValue === 'true' : Number(bulkValue) }));
    updateVariants(newVariants);
    showToast.success(`Applied ${bulkField} = ${bulkValue} to all variants`);
    setBulkValue('');
  };

  return (
    <div className="variant-builder">
      <div className="variant-builder-section">
        <div className="variant-builder-header">
          <h4>Variant Options</h4>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addOptionGroup}>
            <Plus size={14} /> Add Option
          </button>
        </div>

        {variantOptions.map((opt, optIndex) => (
          <div key={optIndex} className="variant-option-row">
            <div className="variant-option-name">
              <input
                type="text"
                className="form-control"
                placeholder="Option name (e.g. Size, Color)"
                value={opt.name}
                onChange={(e) => updateOptionName(optIndex, e.target.value)}
              />
              <button type="button" className="variant-option-remove" onClick={() => removeOptionGroup(optIndex)}>
                <X size={16} />
              </button>
            </div>
            <div className="variant-tag-input">
              <div className="variant-tags">
                {opt.values.map((val, valIndex) => (
                  <span key={valIndex} className="variant-tag">
                    {val}
                    <button type="button" onClick={() => removeOptionValue(optIndex, valIndex)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type and press Enter"
                  value={tagInputs[optIndex] || ''}
                  onChange={(e) => setTagInputs({ ...tagInputs, [optIndex]: e.target.value })}
                  onKeyDown={(e) => handleTagKeyDown(e, optIndex)}
                  onBlur={() => {
                    if (tagInputs[optIndex]) {
                      addOptionValue(optIndex, tagInputs[optIndex]);
                      setTagInputs({ ...tagInputs, [optIndex]: '' });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {variantOptions.length > 0 && variantOptions.some(o => o.name && o.values.length > 0) && (
          <button type="button" className="btn btn-primary btn-sm" onClick={generateCombinations} style={{ marginTop: '0.75rem' }}>
            <RefreshCw size={14} /> Generate Combinations
          </button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="variant-builder-section">
          <div className="variant-builder-header">
            <h4>Variants ({variants.length})</h4>
            <div className="variant-bulk-actions">
              <select value={bulkField} onChange={(e) => setBulkField(e.target.value)} className="form-control" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}>
                <option value="price">Price</option>
                <option value="salePrice">Sale Price</option>
                <option value="stock">Stock</option>
                <option value="deliveryCharge">Delivery</option>
              </select>
              <input
                type="number"
                className="form-control"
                placeholder="Value"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                style={{ width: '100px', padding: '4px 8px', fontSize: '0.8rem' }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={applyBulk}>Apply All</button>
            </div>
          </div>

          <div className="variants-list">
            {variants.map((variant, vIdx) => {
              const optVals = variant.optionValues instanceof Map
                ? Object.fromEntries(variant.optionValues)
                : variant.optionValues || {};

              return (
                <div key={vIdx} className={`variant-card ${!variant.isActive ? 'variant-inactive' : ''}`}>
                  <div className="variant-card-header">
                    <span className="variant-card-label">
                      {Object.values(optVals).join(' / ')}
                    </span>
                    <div className="variant-card-actions">
                      <label className="variant-toggle">
                        <input
                          type="checkbox"
                          checked={variant.isActive !== false}
                          onChange={(e) => updateVariant(vIdx, 'isActive', e.target.checked)}
                        />
                        <span className="variant-toggle-text">{variant.isActive !== false ? 'Active' : 'Inactive'}</span>
                      </label>
                      <button type="button" className="variant-remove-btn" onClick={() => removeVariant(vIdx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="variant-card-fields">
                    <div className="variant-field">
                      <label>Price (৳)</label>
                      <input type="number" className="form-control" value={variant.price}
                        onChange={(e) => updateVariant(vIdx, 'price', e.target.value)} placeholder="0" />
                    </div>
                    <div className="variant-field">
                      <label>Sale Price</label>
                      <input type="number" className="form-control" value={variant.salePrice || ''}
                        onChange={(e) => updateVariant(vIdx, 'salePrice', e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="variant-field">
                      <label>Stock</label>
                      <input type="number" className="form-control" value={variant.stock}
                        onChange={(e) => updateVariant(vIdx, 'stock', e.target.value)} placeholder="0" />
                    </div>
                    <div className="variant-field">
                      <label>SKU</label>
                      <input type="text" className="form-control" value={variant.sku}
                        onChange={(e) => updateVariant(vIdx, 'sku', e.target.value)} placeholder="Auto" />
                    </div>
                    <div className="variant-field">
                      <label>Delivery (৳)</label>
                      <input type="number" className="form-control" value={variant.deliveryCharge ?? ''}
                        onChange={(e) => updateVariant(vIdx, 'deliveryCharge', e.target.value)} placeholder="Inherit" />
                    </div>
                  </div>

                  <div className="variant-card-images">
                    <label>Images</label>
                    <div className="variant-images-row">
                      {(variant.images || []).map((img, imgIdx) => (
                        <div key={imgIdx} className="variant-image-thumb">
                          <img src={img} alt="" />
                          <button type="button" onClick={() => removeVariantImage(vIdx, imgIdx)}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <label className="variant-image-upload">
                        {uploadingFor === vIdx ? (
                          <span className="variant-uploading">...</span>
                        ) : (
                          <>
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageUpload(vIdx, e.target.files?.[0])}
                            />
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantBuilder;
