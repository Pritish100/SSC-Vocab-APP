import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { parseWordListCandidates } from './src/utils/wordListParser';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy/safe Gemini Client initialization
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseFriendlyErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const rawMsg = err.message || String(err);
  
  if (
    rawMsg.includes('503') ||
    rawMsg.includes('high demand') ||
    rawMsg.includes('UNAVAILABLE') ||
    rawMsg.includes('overloaded') ||
    rawMsg.includes('temporarily unavailable')
  ) {
    return 'The AI service is experiencing high demand right now. Please wait a few seconds and try again.';
  }

  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached. Please wait a few seconds and try again.';
  }

  try {
    const jsonStart = rawMsg.indexOf('{');
    const jsonEnd = rawMsg.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(rawMsg.slice(jsonStart, jsonEnd + 1));
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {
    // ignore parse error
  }

  return rawMsg;
}

// Resilient model caller: Primary (gemini-3.1-flash-lite) -> Fallback (gemini-3.8-flash)
// Automatically retries with exponential backoff on 503 high demand / 429 rate limit
async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  }
) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...options,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '');
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('overloaded');

        if (isTransient) {
          console.log(`[Gemini API] Model ${model} (attempt ${attempt + 1}/2) transient: ${errMsg.slice(0, 120)}`);
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          continue;
        } else {
          throw err;
        }
      }
    }
    console.log(`[Gemini API] Model ${model} unavailable, switching to next fallback model...`);
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Extraction & Tokenization endpoint
app.post('/api/extract-words', async (req, res) => {
  try {
    const { rawInput, existingFamilies = [], targetLanguage = 'Hindi' } = req.body;

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return res.status(400).json({ error: 'Input text is required.' });
    }

    const ai = getGenAI();

    const existingFamilyPrompt = existingFamilies.length > 0
      ? `\nEXISTING WORD FAMILIES IN USER'S VOCABULARY BANK:\n${existingFamilies
          .map((f: { name: string; words?: string[]; description?: string }) => 
            `- "${f.name}": contains words like [${(f.words || []).slice(0, 8).join(', ')}] (${f.description || ''})`
          )
          .join('\n')}\nCRITICAL INSTRUCTION: If any extracted word conceptually belongs to one of these existing families, reuse that exact existing family name. If it does not belong, invent a clean, focused semantic family name.
IMPORTANT: Never dump words into giant catch-all buckets. Adhere strictly to the semantic domain separation rules below.`
      : '\nGroup related words into clean, intuitive, and semantically focused word family names (e.g., "Vision & Observation", "Emotional Pacification & Temper", "Reduction & Severity Mitigation", "Escalation & Aggravation").';

    const systemInstruction = `You are an expert lexicographer and vocabulary instructor.
The user wants to extract vocabulary words and structure each word into a tokenized vocabulary format.

Each word must follow this exact structural pattern:
{Word} ({PartOfSpeech}) — {Meaning/Translation in ${targetLanguage}}
{Definition}
Usage: {Usage sentence}

Example:
Provoke (Verb) — उकसाना
To deliberately or unintentionally cause a reaction, especially a strong emotional response.
Usage: His provocative remarks provoked an angry response from the audience.

Rules:
1. Provide the accurate Part of Speech (e.g., "Verb", "Noun", "Adjective", "Adverb").
2. Provide the accurate translation/meaning in ${targetLanguage} (e.g., in Hindi with correct Devanagari script, like "उकसाना" for Provoke).
3. Provide a clear, accessible, learner-friendly English definition.
4. Provide a natural, context-rich example sentence labeled as "Usage: ...".
5. Assign each word to a "wordFamily" (semantic category).
SEMANTIC CLUSTERING GRANULARITY & ACCURACY RULES:
- Never create overly broad or catch-all 'kitchen sink' families (avoid combining disparate emotions, systems, and actions under generic buckets like "Intensity & Mitigation").
- SEPARATE HUMAN FEELINGS FROM PHYSICAL/SYSTEMIC ACTIONS:
  * Words concerning calming human emotions, soothing anger, or placating people (e.g., placate, mollify, pacify, appease, conciliate, soothe) MUST be placed in an emotional pacification family (e.g., "Emotional Pacification & Temper").
  * Words concerning diminishing pain, physical force, disaster severity, or systemic risks (e.g., mitigate, alleviate, attenuate, abate, palliate) MUST be placed in a reduction/mitigation family (e.g., "Reduction & Severity Mitigation").
  * Words concerning intensifying, worsening, or aggravating conflicts or forces (e.g., exacerbate, aggravate, escalate, intensify, amplify) MUST be placed in an escalation family (e.g., "Escalation & Aggravation").
- Never lump opposing concepts together (do NOT put words that escalate and words that mitigate into a single family; keep them distinct).
- Keep word families focused (ideally 4 to 12 words per family) so learners can master distinct nuances without feeling overwhelmed.
${existingFamilyPrompt}
6. Provide a concise explanation of the word's specific nuance within its family.
7. Include 2-4 close synonyms.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        extractedWords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: {
                type: Type.STRING,
                description: 'The vocabulary word (e.g. "Provoke", "Observe")',
              },
              partOfSpeech: {
                type: Type.STRING,
                description: 'Part of speech (e.g. "Verb", "Noun", "Adjective", "Adverb")',
              },
              translation: {
                type: Type.STRING,
                description: `Accurate vernacular meaning or translation in ${targetLanguage} (e.g. "उकसाना")`,
              },
              definition: {
                type: Type.STRING,
                description: 'Concise, clear definition explaining the meaning.',
              },
              usage: {
                type: Type.STRING,
                description: 'High-quality example sentence showing the word in context.',
              },
              wordFamily: {
                type: Type.STRING,
                description: 'The semantic category or word family name (matches existing family if applicable).',
              },
              familyDescription: {
                type: Type.STRING,
                description: 'Brief description of this word family cluster.',
              },
              nuance: {
                type: Type.STRING,
                description: 'Specific nuance or distinction of this word within its family.',
              },
              synonyms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Related words / synonyms in this family.',
              },
            },
            required: ['word', 'partOfSpeech', 'translation', 'definition', 'usage', 'wordFamily'],
          },
        },
      },
      required: ['extractedWords'],
    };

    // Check if user input is an explicit list of words (e.g. 100 words pasted)
    const detectedWords = parseWordListCandidates(rawInput);

    if (detectedWords.length > 0) {
      console.log(`[Extract API] Detected explicit word list of ${detectedWords.length} words.`);
      
      // Batch words into chunks of 15 to stay within output token limits and guarantee 100% extraction
      const BATCH_SIZE = 15;
      const batches: string[][] = [];
      for (let i = 0; i < detectedWords.length; i += BATCH_SIZE) {
        batches.push(detectedWords.slice(i, i + BATCH_SIZE));
      }

      // Process batches with concurrency of 3
      const allExtractedWords: any[] = [];
      const CONCURRENCY = 3;

      for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const currentSlice = batches.slice(i, i + CONCURRENCY);
        const batchPromises = currentSlice.map(async (batch, sliceIdx) => {
          const batchIndex = i + sliceIdx + 1;
          const prompt = `Tokenize the following EXACT list of ${batch.length} vocabulary words:
${batch.map((w, idx) => `${idx + 1}. ${w}`).join('\n')}

MANDATORY REQUIREMENT:
You MUST tokenize and return EVERY SINGLE ONE of these ${batch.length} words in your "extractedWords" array. Do not skip or omit any word.`;

          const response = await generateContentWithRetryAndFallback(ai, {
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema,
            },
          });

          const jsonText = response.text?.trim() || '{}';
          const parsed = JSON.parse(jsonText);
          return (parsed.extractedWords || []) as any[];
        });

        const results = await Promise.all(batchPromises);
        for (const batchWords of results) {
          allExtractedWords.push(...batchWords);
        }
      }

      // Deduplicate extracted words by case-insensitive word headword
      const seenWords = new Set<string>();
      const dedupedWords: any[] = [];
      for (const w of allExtractedWords) {
        const key = (w.word || '').trim().toLowerCase();
        if (key && !seenWords.has(key)) {
          seenWords.add(key);
          dedupedWords.push(w);
        }
      }

      return res.json({
        words: dedupedWords,
      });
    }

    // Otherwise, input is a continuous reading passage, notes, or article
    const response = await generateContentWithRetryAndFallback(ai, {
      contents: `Extract all key vocabulary words from the following passage/text and structure each into tokenized format:\n\n"""\n${rawInput.slice(0, 30000)}\n"""\n\nIdentify all notable or advanced vocabulary terms from the text with comprehensive coverage.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    const rawList = (parsed.extractedWords || []) as any[];

    // Deduplicate extracted words by case-insensitive word headword
    const seenWords = new Set<string>();
    const dedupedWords: any[] = [];
    for (const w of rawList) {
      const key = (w.word || '').trim().toLowerCase();
      if (key && !seenWords.has(key)) {
        seenWords.add(key);
        dedupedWords.push(w);
      }
    }

    res.json({
      words: dedupedWords,
    });
  } catch (error: any) {
    console.error('Error extracting vocabulary:', error);
    res.status(500).json({
      error: parseFriendlyErrorMessage(error),
    });
  }
});

// Single word enrich / quick lookup
app.post('/api/enrich-word', async (req, res) => {
  try {
    const { word, existingFamilies = [], targetLanguage = 'Hindi' } = req.body;
    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Word is required.' });
    }

    const ai = getGenAI();

    const existingFamilyPrompt = existingFamilies.length > 0
      ? `\nExisting word families: ${existingFamilies.map((f: any) => `"${f.name}"`).join(', ')}. If this word fits one of these, reuse that exact name.`
      : '';

    const response = await generateContentWithRetryAndFallback(ai, {
      contents: `Tokenize this single vocabulary word: "${word}". Target language for translation: ${targetLanguage}.${existingFamilyPrompt}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            translation: { type: Type.STRING },
            definition: { type: Type.STRING },
            usage: { type: Type.STRING },
            wordFamily: { type: Type.STRING },
            familyDescription: { type: Type.STRING },
            nuance: { type: Type.STRING },
            synonyms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['word', 'partOfSpeech', 'translation', 'definition', 'usage', 'wordFamily'],
        },
      },
    });

    const jsonText = response.text?.trim() || '{}';
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error enriching word:', error);
    res.status(500).json({
      error: parseFriendlyErrorMessage(error),
    });
  }
});

// AI Smart Re-clustering / Family Split endpoint
app.post('/api/split-family', async (req, res) => {
  try {
    const { familyName, words } = req.body;
    if (!familyName || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'familyName and words array are required.' });
    }

    const ai = getGenAI();

    const prompt = `You are an expert lexicologist and vocabulary taxonomist.
The user has a word family named "${familyName}" containing ${words.length} words that are currently mixed together:
${words.map((w: any, idx: number) => `${idx + 1}. ${w.word} (${w.partOfSpeech || 'Word'}) [id: ${w.id}] — ${w.definition || ''}`).join('\n')}

TASK:
Reorganize and split these ${words.length} words into 2 to 4 distinct, semantically pure, and contextually focused word families.

CRITICAL RULES:
1. SEPARATE HUMAN FEELINGS & ANGER FROM PHYSICAL/SYSTEMIC ACTIONS:
   - Group words about calming human emotions, soothing hurt feelings, or pacifying anger/people into an emotional pacification family (e.g., "Emotional Pacification & Temper").
   - Group words about diminishing pain, physical force, disaster severity, damage, or risk into a reduction/mitigation family (e.g., "Reduction & Severity Mitigation").
   - Group words about intensifying, escalating, or worsening forces or conflicts into an escalation family (e.g., "Escalation & Aggravation").
2. NEVER create a generic catch-all bucket. Every family name must be clear, evocative, and intuitive for language learners.
3. Account for EVERY SINGLE word from the input list. Assign each word to its best matching new family name.
4. For each word, explain its specific nuance in that new family.`;

    const response = await generateContentWithRetryAndFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newFamilies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Descriptive family name (e.g. "Emotional Pacification & Temper")' },
                  description: { type: Type.STRING, description: '1-sentence concise description of the semantic cluster' },
                },
                required: ['name', 'description'],
              },
            },
            assignments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  wordId: { type: Type.STRING, description: 'The original word ID' },
                  word: { type: Type.STRING, description: 'The word headword' },
                  newFamilyName: { type: Type.STRING, description: 'The assigned new family name' },
                  nuance: { type: Type.STRING, description: 'Specific nuance of the word in this family' },
                },
                required: ['wordId', 'word', 'newFamilyName'],
              },
            },
          },
          required: ['newFamilies', 'assignments'],
        },
      },
    });

    const jsonText = response.text?.trim() || '{}';
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error splitting family:', error);
    res.status(500).json({
      error: parseFriendlyErrorMessage(error),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
