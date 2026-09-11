import { WordToken, WordFamily } from '../types';

export interface SplitResult {
  newFamilies: {
    name: string;
    description: string;
  }[];
  assignments: {
    wordId: string;
    word: string;
    newFamilyName: string;
    nuance?: string;
  }[];
}

// Well-curated classification for Intensity & Mitigation and related words
const EMOTIONAL_PACIFICATION_KEYWORDS = new Set([
  'placate', 'mollify', 'pacify', 'appease', 'conciliate', 'propitiate',
  'soothe', 'calm', 'assuage', 'quell', 'sedate', 'defuse', 'lull', 'solace',
  'reconcile', 'tranquilize', 'comfort', 'mellow'
]);

const ESCALATION_AGGRAVATION_KEYWORDS = new Set([
  'exacerbate', 'aggravate', 'escalate', 'intensify', 'amplify', 'heighten',
  'worsen', 'flare', 'inflame', 'augment', 'sharpen', 'deepen', 'mount',
  'surge', 'compound', 'agitate', 'provoke', 'inflame', 'stoke', 'magnify'
]);

/**
 * Instant local heuristic split for "Intensity & Mitigation" or broad intensity families.
 */
export function heuristicSplitIntensityFamily(
  familyName: string,
  tokens: WordToken[]
): SplitResult {
  const emotionalFam = 'Emotional Pacification & Temper';
  const mitigationFam = 'Reduction & Severity Mitigation';
  const escalationFam = 'Escalation & Aggravation';

  const newFamilies = [
    {
      name: emotionalFam,
      description: 'Words concerning calming human emotions, soothing hurt feelings, or pacifying anger and hostility.',
    },
    {
      name: mitigationFam,
      description: 'Words concerning diminishing pain, physical force, disaster severity, or systemic risks.',
    },
    {
      name: escalationFam,
      description: 'Words concerning intensifying forces, worsening conflicts, or exacerbating problems.',
    },
  ];

  const assignments = tokens.map((token) => {
    const lower = token.word.trim().toLowerCase();
    const defLower = (token.definition || '').toLowerCase();
    const nuanceLower = (token.nuance || '').toLowerCase();

    // Check emotion / feelings
    if (
      EMOTIONAL_PACIFICATION_KEYWORDS.has(lower) ||
      defLower.includes('anger') ||
      defLower.includes('hostil') ||
      defLower.includes('placat') ||
      defLower.includes('sooth') ||
      defLower.includes('feelings') ||
      defLower.includes('appeas') ||
      nuanceLower.includes('emotion') ||
      nuanceLower.includes('calm')
    ) {
      return {
        wordId: token.id,
        word: token.word,
        newFamilyName: emotionalFam,
        nuance: token.nuance || 'Focuses on pacifying hurt feelings, easing human temper, or resolving interpersonal friction.',
      };
    }

    // Check escalation / worsening
    if (
      ESCALATION_AGGRAVATION_KEYWORDS.has(lower) ||
      defLower.includes('worsen') ||
      defLower.includes('intensif') ||
      defLower.includes('escalat') ||
      defLower.includes('increas') ||
      defLower.includes('aggravat') ||
      defLower.includes('exacerbat')
    ) {
      return {
        wordId: token.id,
        word: token.word,
        newFamilyName: escalationFam,
        nuance: token.nuance || 'Focuses on ratcheting up intensity, exacerbating friction, or scaling upward.',
      };
    }

    // Default to Reduction & Severity Mitigation
    return {
      wordId: token.id,
      word: token.word,
      newFamilyName: mitigationFam,
      nuance: token.nuance || 'Focuses on lessening pain, softening impacts, or reducing risk and damage.',
    };
  });

  return {
    newFamilies,
    assignments,
  };
}

/**
 * Smart AI Split with automatic fallback to heuristics
 */
export async function smartSplitFamily(
  familyName: string,
  tokens: WordToken[]
): Promise<SplitResult> {
  try {
    const res = await fetch('/api/split-family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyName,
        words: tokens.map((t) => ({
          id: t.id,
          word: t.word,
          partOfSpeech: t.partOfSpeech,
          definition: t.definition,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.newFamilies && data.assignments && data.assignments.length > 0) {
        return data as SplitResult;
      }
    }
  } catch (e) {
    console.warn('AI split family API call failed, falling back to heuristic split:', e);
  }

  return heuristicSplitIntensityFamily(familyName, tokens);
}
