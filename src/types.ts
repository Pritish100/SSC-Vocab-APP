export interface WordToken {
  id: string;
  word: string;
  partOfSpeech: string;
  translation: string;
  definition: string;
  usage: string;
  wordFamily: string;
  familyDescription?: string;
  nuance?: string;
  synonyms?: string[];
  createdAt: number;
  tags?: string[];
  mastered?: boolean;
}

export interface WordFamily {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export type ViewMode = 'families' | 'all' | 'practice';

export interface ExtractionResult {
  words: Omit<WordToken, 'id' | 'createdAt'>[];
}
