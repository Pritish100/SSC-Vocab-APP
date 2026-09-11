import { WordToken } from '../types';

export function formatAsTokenString(word: WordToken): string {
  return `${word.word} (${word.partOfSpeech}) — ${word.translation}\n${word.definition}\nUsage: ${word.usage}`;
}

export function speakWord(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function exportWordsAsPlainText(words: WordToken[]): string {
  const groupedByFamily: Record<string, WordToken[]> = {};
  words.forEach((w) => {
    if (!groupedByFamily[w.wordFamily]) {
      groupedByFamily[w.wordFamily] = [];
    }
    groupedByFamily[w.wordFamily].push(w);
  });

  const blocks: string[] = [];
  for (const [familyName, familyWords] of Object.entries(groupedByFamily)) {
    blocks.push(`=========================================`);
    blocks.push(`WORD FAMILY: ${familyName.toUpperCase()}`);
    blocks.push(`Total words: ${familyWords.length}`);
    blocks.push(`=========================================\n`);
    familyWords.forEach((w) => {
      blocks.push(formatAsTokenString(w));
      if (w.nuance) {
        blocks.push(`Nuance: ${w.nuance}`);
      }
      blocks.push(''); // blank line
    });
    blocks.push('\n');
  }

  return blocks.join('\n');
}
