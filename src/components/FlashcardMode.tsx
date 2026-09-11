import React, { useState, useEffect } from 'react';
import { WordToken } from '../types';
import { Volume2, CheckCircle2, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Tag, Sparkles } from 'lucide-react';
import { speakWord } from '../utils/formatters';

interface FlashcardModeProps {
  words: WordToken[];
  onToggleMastered: (id: string) => void;
  families: string[];
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  words,
  onToggleMastered,
  families,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeWords, setActiveWords] = useState<WordToken[]>(words);

  useEffect(() => {
    let filtered = words;
    if (selectedFamily !== 'all') {
      filtered = words.filter((w) => w.wordFamily === selectedFamily);
    }
    setActiveWords(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedFamily, words]);

  const currentWord = activeWords[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeWords.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + activeWords.length) % activeWords.length);
  };

  const handleShuffle = () => {
    const shuffled = [...activeWords].sort(() => Math.random() - 0.5);
    setActiveWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!currentWord) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
        <p className="text-stone-500 text-sm">No words available in this selection to practice.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Tag className="w-4 h-4 text-stone-500" />
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="text-xs font-medium border border-stone-200 rounded-lg px-2.5 py-1.5 bg-stone-50 text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          >
            <option value="all">All Word Families ({words.length} words)</option>
            {families.map((fam) => {
              const count = words.filter((w) => w.wordFamily === fam).length;
              return (
                <option key={fam} value={fam}>
                  {fam} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
          <span className="text-xs font-mono text-stone-500 px-2">
            {currentIndex + 1} / {activeWords.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-stone-900 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with 3D Flip */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[360px] relative rounded-2xl border-2 border-stone-300/80 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between select-none"
      >
        {/* Card Header Info */}
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="inline-flex items-center gap-1 font-medium text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
            <Tag className="w-3 h-3 text-stone-500" />
            Family: {currentWord.wordFamily}
          </span>
          <span className="text-[11px] font-sans text-stone-400">
            Click anywhere to {isFlipped ? 'flip back' : 'reveal meaning & usage'}
          </span>
        </div>

        {/* Card Body */}
        {!isFlipped ? (
          /* FRONT */
          <div className="my-auto text-center space-y-4 py-8">
            <div className="inline-block">
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 tracking-tight">
                {currentWord.word}
              </h2>
              <span className="text-sm font-mono text-stone-500 uppercase mt-2 block">
                {currentWord.partOfSpeech}
              </span>
            </div>

            <p className="text-xs text-stone-400 font-sans italic max-w-sm mx-auto">
              How does this word fit into the "{currentWord.wordFamily}" family? Tap to check.
            </p>
          </div>
        ) : (
          /* BACK - TOKENIZED STRUCTURE */
          <div className="my-auto space-y-4 py-4 animate-in fade-in duration-200">
            {/* Line 1 */}
            <div className="border-l-4 border-stone-900 pl-4 py-1 bg-stone-50 rounded-r-lg">
              <h3 className="text-2xl font-serif font-bold text-stone-900 flex items-baseline gap-2 flex-wrap">
                <span>{currentWord.word}</span>
                <span className="text-stone-500 font-normal text-sm">({currentWord.partOfSpeech})</span>
                <span className="text-stone-400">—</span>
                <span className="text-amber-800 font-sans text-lg">{currentWord.translation}</span>
              </h3>
            </div>

            {/* Line 2 */}
            <p className="text-stone-800 text-sm leading-relaxed font-normal">
              {currentWord.definition}
            </p>

            {/* Line 3 */}
            <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 text-xs">
              <span className="font-semibold text-stone-900 mr-1.5">Usage:</span>
              <span className="italic text-stone-700 font-serif text-[13px]">{currentWord.usage}</span>
            </div>

            {/* Nuance in Family */}
            {currentWord.nuance && (
              <p className="text-xs text-stone-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <span className="font-semibold text-amber-900">Family nuance: </span>
                {currentWord.nuance}
              </p>
            )}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakWord(currentWord.word);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>Pronounce</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMastered(currentWord.id);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              currentWord.mastered
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{currentWord.mastered ? 'Mastered' : 'Mark as Mastered'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Word</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-3 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white transition-colors shadow-xs"
        >
          <span>Next Word</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
