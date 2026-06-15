import React from 'react';
import { Check, FileText, Package, Ruler, Truck, Info, Sparkles } from 'lucide-react';
import { parseDescription, parseKeyValueLines, parseListLines } from '../utils/descriptionParser';

/**
 * Renders a product's free-text description as a typed, structured layout.
 *
 * The admin enters everything in one textarea using bracketed markers like
 * [FEATURES] / [DELIVERY]; this component routes each detected section to a
 * dedicated visual treatment. If no marker is present, the whole input is
 * shown as a plain paragraph block — i.e. legacy products keep working.
 */
const ProductDescription = ({ description }) => {
  const sections = parseDescription(description);
  if (sections.length === 0) return null;

  // Always render FEATURES first when present — it's the most visually
  // prominent section per the spec — then keep author-defined order.
  const ordered = [...sections].sort((a, b) => {
    if (a.type === 'FEATURES' && b.type !== 'FEATURES') return -1;
    if (b.type === 'FEATURES' && a.type !== 'FEATURES') return 1;
    return 0;
  });

  return (
    <div className="product-desc">
      {ordered.map((section, idx) => (
        <Section key={`${section.type}-${idx}`} section={section} />
      ))}
    </div>
  );
};

const Section = ({ section }) => {
  switch (section.type) {
    case 'FEATURES':    return <FeaturesSection lines={section.lines} />;
    case 'DESCRIPTION': return <DescriptionSection body={section.body} />;
    case 'MATERIALS':   return <MaterialsSection lines={section.lines} />;
    case 'DIMENSIONS':  return <DimensionsSection lines={section.lines} />;
    case 'DELIVERY':    return <DeliverySection lines={section.lines} />;
    case 'NOTES':       return <NotesSection body={section.body} />;
    default:            return null;
  }
};

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="product-desc-header">
    <span className="product-desc-icon"><Icon size={18} /></span>
    <h3 className="product-desc-title">{title}</h3>
  </div>
);

const FeaturesSection = ({ lines }) => {
  const items = parseListLines(lines);
  if (items.length === 0) return null;
  return (
    <section className="product-desc-block product-desc-features">
      <SectionHeader icon={Sparkles} title="Key Features" />
      <ul className="product-desc-feature-grid">
        {items.map((item, i) => (
          <li key={i} className="product-desc-feature-item">
            <span className="product-desc-check"><Check size={14} strokeWidth={3} /></span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const DescriptionSection = ({ body }) => (
  <section className="product-desc-block product-desc-description">
    <SectionHeader icon={FileText} title="Description" />
    <p className="product-desc-paragraph">{body}</p>
  </section>
);

const MaterialsSection = ({ lines }) => {
  const items = parseListLines(lines);
  if (items.length === 0) return null;
  return (
    <section className="product-desc-block product-desc-card">
      <SectionHeader icon={Package} title="Materials" />
      <div className="product-desc-chip-row">
        {items.map((item, i) => (
          <span key={i} className="product-desc-chip">{item}</span>
        ))}
      </div>
    </section>
  );
};

const DimensionsSection = ({ lines }) => {
  const rows = parseKeyValueLines(lines);
  if (rows.length === 0) return null;
  return (
    <section className="product-desc-block product-desc-card">
      <SectionHeader icon={Ruler} title="Dimensions" />
      <dl className="product-desc-spec-list">
        {rows.map((row, i) => (
          <div key={i} className="product-desc-spec-row">
            <dt>{row.label}</dt>
            <dd>{row.value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const DeliverySection = ({ lines }) => {
  const rows = parseKeyValueLines(lines);
  if (rows.length === 0) return null;
  return (
    <section className="product-desc-block product-desc-delivery">
      <SectionHeader icon={Truck} title="Delivery Information" />
      <dl className="product-desc-spec-list">
        {rows.map((row, i) => (
          <div key={i} className="product-desc-spec-row">
            <dt>{row.label}</dt>
            <dd>{row.value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const NotesSection = ({ body }) => (
  <section className="product-desc-block product-desc-notes">
    <SectionHeader icon={Info} title="Notes" />
    {/* whiteSpace preserves intentional line breaks the admin entered. */}
    <p className="product-desc-paragraph" style={{ whiteSpace: 'pre-line' }}>{body}</p>
  </section>
);

export default ProductDescription;
