import { describe, test, expect } from 'vitest';
import { parseDescription, parseKeyValueLines, parseListLines } from '../utils/descriptionParser';

describe('parseDescription', () => {
  test('returns empty array for empty/whitespace input', () => {
    expect(parseDescription('')).toEqual([]);
    expect(parseDescription('   \n  ')).toEqual([]);
    expect(parseDescription(null)).toEqual([]);
    expect(parseDescription(undefined)).toEqual([]);
  });

  test('backward compat: no markers => single DESCRIPTION section with full text', () => {
    const raw = 'Just a plain product description.\nWith two lines.';
    const out = parseDescription(raw);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('DESCRIPTION');
    expect(out[0].body).toBe(raw);
  });

  test('parses the spec example into 6 ordered sections', () => {
    const raw = [
      '[FEATURES]',
      'Premium Burma Cane',
      'Handmade Construction',
      'Adult Size',
      'Durable & Long Lasting',
      '',
      '[DESCRIPTION]',
      'Beautiful handcrafted cane chair suitable for indoor and outdoor use.',
      '',
      '[MATERIALS]',
      'Burma Cane',
      'Sylheti Cane',
      'Foam Cushion',
      '',
      '[DIMENSIONS]',
      'Seat Height: 16-18 inches',
      '',
      '[DELIVERY]',
      'Delivery Charge: ৳350',
      'Estimated Delivery: 5-6 Days',
      '',
      '[NOTES]',
      'Customization available.'
    ].join('\n');

    const out = parseDescription(raw);
    expect(out.map(s => s.type)).toEqual(['FEATURES', 'DESCRIPTION', 'MATERIALS', 'DIMENSIONS', 'DELIVERY', 'NOTES']);
    expect(out[0].lines).toEqual(['Premium Burma Cane', 'Handmade Construction', 'Adult Size', 'Durable & Long Lasting']);
    expect(out[3].body).toBe('Seat Height: 16-18 inches');
    expect(out[4].lines).toEqual(['Delivery Charge: ৳350', 'Estimated Delivery: 5-6 Days']);
  });

  test('text before the first marker becomes an implicit DESCRIPTION', () => {
    const raw = 'Lead-in sentence.\n\n[FEATURES]\nFoo\nBar';
    const out = parseDescription(raw);
    expect(out).toHaveLength(2);
    expect(out[0].type).toBe('DESCRIPTION');
    expect(out[0].body).toBe('Lead-in sentence.');
    expect(out[1].type).toBe('FEATURES');
  });

  test('gracefully handles missing sections (only some markers present)', () => {
    const raw = '[FEATURES]\nFoo\n\n[NOTES]\nBeware.';
    const out = parseDescription(raw);
    expect(out.map(s => s.type)).toEqual(['FEATURES', 'NOTES']);
  });

  test('drops sections that have no body content', () => {
    const raw = '[FEATURES]\n\n[NOTES]\nReal note';
    const out = parseDescription(raw);
    expect(out.map(s => s.type)).toEqual(['NOTES']);
  });

  test('preserves blank lines inside a section\'s body', () => {
    const raw = '[DESCRIPTION]\nLine 1\n\nLine 3';
    const out = parseDescription(raw);
    expect(out[0].body).toBe('Line 1\n\nLine 3');
  });

  test('handles CRLF line endings', () => {
    const raw = '[FEATURES]\r\nFoo\r\nBar';
    const out = parseDescription(raw);
    expect(out[0].lines).toEqual(['Foo', 'Bar']);
  });

  test('unknown markers are kept as content of the current section', () => {
    const raw = '[FEATURES]\nFoo\n[SHIPPING]\nThis is not a real marker';
    const out = parseDescription(raw);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('FEATURES');
    expect(out[0].lines).toContain('[SHIPPING]');
  });
});

describe('parseKeyValueLines', () => {
  test('splits on first colon, trims both sides', () => {
    expect(parseKeyValueLines(['Seat Height: 16-18 inches'])).toEqual([
      { label: 'Seat Height', value: '16-18 inches' }
    ]);
  });

  test('returns label only when no colon is present', () => {
    expect(parseKeyValueLines(['No colon here'])).toEqual([
      { label: 'No colon here', value: '' }
    ]);
  });

  test('keeps additional colons inside the value', () => {
    expect(parseKeyValueLines(['Time: 9:30 AM'])).toEqual([
      { label: 'Time', value: '9:30 AM' }
    ]);
  });
});

describe('parseListLines', () => {
  test('strips leading bullets and trims', () => {
    expect(parseListLines(['- Foo', '* Bar', '• Baz', '  Qux'])).toEqual(['Foo', 'Bar', 'Baz', 'Qux']);
  });

  test('drops blank lines', () => {
    expect(parseListLines(['Foo', '', '   ', 'Bar'])).toEqual(['Foo', 'Bar']);
  });
});
