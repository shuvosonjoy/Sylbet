/**
 * Product description parser.
 *
 * Splits raw description text into typed sections by recognising bracketed
 * markers on their own line:
 *
 *   [FEATURES]
 *   Premium Burma Cane
 *   Handmade Construction
 *
 *   [DESCRIPTION]
 *   Beautiful handcrafted cane chair...
 *
 * Returns an array of { type, lines, body } in document order so the renderer
 * controls layout but the parser stays presentation-free.
 *
 * Backward compat: if no recognised marker appears anywhere in the input, the
 * entire string is returned as a single DESCRIPTION section. This lets every
 * legacy product render unchanged without a data migration.
 *
 * Unknown markers (e.g. [SHIPPING]) are kept verbatim as part of the preceding
 * section's content rather than silently dropped, so admins get visible
 * feedback if they typo a marker.
 */

export const SECTION_TYPES = ['FEATURES', 'DESCRIPTION', 'MATERIALS', 'DIMENSIONS', 'DELIVERY', 'NOTES'];

const MARKER_RE = /^\[([A-Z]+)\]\s*$/;

const splitLines = (text) => String(text || '').replace(/\r\n/g, '\n').split('\n');

export const parseDescription = (raw) => {
  const text = String(raw || '');
  if (!text.trim()) return [];

  const lines = splitLines(text);

  // Detect whether ANY known marker exists. If not, preserve the original
  // single-textarea behaviour.
  const hasKnownMarker = lines.some((line) => {
    const m = line.match(MARKER_RE);
    return m && SECTION_TYPES.includes(m[1]);
  });

  if (!hasKnownMarker) {
    return [{ type: 'DESCRIPTION', lines: lines, body: text.trim() }];
  }

  const sections = [];
  let current = null;
  // Anything before the first marker becomes an implicit DESCRIPTION section
  // so admins can lead with a sentence and then add structured blocks.
  let preamble = [];

  for (const line of lines) {
    const m = line.match(MARKER_RE);
    if (m && SECTION_TYPES.includes(m[1])) {
      if (current) sections.push(current);
      else if (preamble.length) {
        const trimmed = trimEmpty(preamble);
        if (trimmed.length) sections.push({ type: 'DESCRIPTION', lines: trimmed, body: trimmed.join('\n').trim() });
        preamble = [];
      }
      current = { type: m[1], lines: [], body: '' };
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }

  if (current) sections.push(current);
  else if (preamble.length) {
    const trimmed = trimEmpty(preamble);
    if (trimmed.length) sections.push({ type: 'DESCRIPTION', lines: trimmed, body: trimmed.join('\n').trim() });
  }

  // Trim leading/trailing blank lines per section and compute a joined body.
  return sections
    .map((s) => {
      const trimmed = trimEmpty(s.lines);
      return { type: s.type, lines: trimmed, body: trimmed.join('\n').trim() };
    })
    .filter((s) => s.body.length > 0);
};

const trimEmpty = (arr) => {
  let start = 0;
  let end = arr.length;
  while (start < end && !arr[start].trim()) start++;
  while (end > start && !arr[end - 1].trim()) end--;
  return arr.slice(start, end);
};

/**
 * Helper for sections like DIMENSIONS / DELIVERY where each line is
 * "Label: Value". Falls back to { label: line, value: '' } if no colon.
 */
export const parseKeyValueLines = (lines) =>
  lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { label: line, value: '' };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });

/**
 * Helper for FEATURES / MATERIALS — strip leading bullet chars so admins can
 * write "- foo" or "• foo" or just "foo" interchangeably.
 */
export const parseListLines = (lines) =>
  lines
    .map((line) => line.replace(/^\s*[-*•·]\s*/, '').trim())
    .filter(Boolean);
