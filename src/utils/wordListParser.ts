/**
 * Robust word list parser for user vocabulary inputs.
 * Detects whether the input is a vocabulary list (plain words, numbered, bulleted,
 * with definitions, parts of speech, hyphens, colons, or commas) and extracts
 * the unique headwords.
 */
export function parseWordListCandidates(input: string): string[] {
  if (!input || typeof input !== 'string') return [];

  const lines = input.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

  if (lines.length >= 2) {
    const extracted: string[] = [];
    for (const line of lines) {
      // Strip leading numbering, bullets, markdown, e.g. '1. ', '1) ', '• ', '- ', '* ', '1 '
      let cleaned = line.replace(/^[\s\d\-•*.)\]\>]+/, '').trim();
      if (!cleaned) continue;

      let word: string | null = null;

      // Pattern 1: Word (optional pos) : / - / = / tab / dash definition
      const delimMatch = cleaned.match(/^([a-zA-Z0-9\s\-']{1,40}?)(?:\s*\([a-zA-Z\s.,/]+\))?\s*[:=\-\t—–]\s*(.+)$/i);
      if (delimMatch) {
        const candidate = delimMatch[1].trim();
        if (candidate && candidate.split(/\s+/).length <= 4) {
          word = candidate;
        }
      }

      // Pattern 2: Word (pos) definition e.g. Admonish (v.) To warn or reprimand
      if (!word) {
        const posMatch = cleaned.match(/^([a-zA-Z0-9\s\-']{1,40}?)\s*\((?:v|n|adj|adv|verb|noun|adjective|adverb|prep|conj)[^)]*\)\s*(.+)$/i);
        if (posMatch) {
          const candidate = posMatch[1].trim();
          if (candidate && candidate.split(/\s+/).length <= 4) {
            word = candidate;
          }
        }
      }

      // Pattern 3: 'Word to do something' or 'Word means something' or 'Word is something'
      if (!word) {
        const defVerbMatch = cleaned.match(/^([a-zA-Z\-']{2,30})\s+(?:to\s+[a-z]|means\s+|refers\s+to\s+|defined\s+as\s+|is\s+a\s+|a\s+[a-z]|an\s+[a-z]|the\s+[a-z])/i);
        if (defVerbMatch) {
          word = defVerbMatch[1].trim();
        }
      }

      // Pattern 4: Line is simply a single word or short phrase (<= 4 words)
      if (!word && cleaned.split(/\s+/).length <= 4 && cleaned.length <= 40) {
        word = cleaned;
      }

      if (word) {
        word = word.replace(/^[^\w]+|[^\w]+$/g, '').trim();
        if (word && /^[a-zA-Z]/.test(word)) {
          extracted.push(word);
        }
      }
    }

    // If at least 30% of non-empty lines yielded a headword and we have >= 2 items
    if (extracted.length >= 2 && extracted.length >= lines.length * 0.3) {
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const w of extracted) {
        const key = w.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(w);
        }
      }
      return deduped;
    }
  }

  // Comma or semicolon or tab delimited
  const commaItems = input
    .split(/[,;\t]+/)
    .map((s) => s.replace(/^[\s\d\-•*.)\]\>]+/, '').trim())
    .filter((s) => s.length > 0 && s.length < 40 && s.split(/\s+/).length <= 4);

  if (commaItems.length >= 2) {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const raw of commaItems) {
      const w = raw.replace(/^[^\w]+|[^\w]+$/g, '').trim();
      if (w && /^[a-zA-Z]/.test(w)) {
        const key = w.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(w);
        }
      }
    }
    if (deduped.length >= 2) return deduped;
  }

  // Space-delimited
  const spaceTokens = input.trim().split(/\s+/);
  if (spaceTokens.length >= 2 && spaceTokens.every((t) => /^[a-zA-Z\-',.]+$/.test(t))) {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const raw of spaceTokens) {
      const w = raw.replace(/^[^\w]+|[^\w]+$/g, '').trim();
      if (w && /^[a-zA-Z]/.test(w)) {
        const key = w.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(w);
        }
      }
    }
    if (deduped.length >= 2) return deduped;
  }

  return [];
}
