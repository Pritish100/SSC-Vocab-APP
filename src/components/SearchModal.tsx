import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WordToken } from '../types';
import {
  Search,
  X,
  Layers,
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronRight,
  Plus,
  ArrowRight,
  Volume2,
  Sparkles,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordToken[];
  onSelectWord: (word: WordToken, action: 'family' | 'all') => void;
  onToggleMastered: (id: string) => void;
  onAddCustomQuery?: (queryText: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  words,
  onSelectWord,
  onToggleMastered,
  onAddCustomQuery,
}) => {
  const [query, setQuery] = useState('');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setExpandedWordId(null);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Extract unique families for quick filter pills
  const availableFamilies = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => {
      if (w.wordFamily) set.add(w.wordFamily);
    });
    return Array.from(set).sort();
  }, [words]);

  // Filtered words based on query & filters
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return words
      .filter((w) => {
        // Family filter
        if (selectedFamilyFilter !== 'all' && w.wordFamily.toLowerCase() !== selectedFamilyFilter.toLowerCase()) {
          return false;
        }

        // Status filter
        if (statusFilter === 'mastered' && !w.mastered) return false;
        if (statusFilter === 'learning' && w.mastered) return false;

        // Query filter
        if (!q) return true;

        const matchWord = w.word.toLowerCase().includes(q);
        const matchTrans = (w.translation || '').toLowerCase().includes(q);
        const matchDef = (w.definition || '').toLowerCase().includes(q);
        const matchUsage = (w.usage || '').toLowerCase().includes(q);
        const matchFam = (w.wordFamily || '').toLowerCase().includes(q);
        const matchNuance = (w.nuance || '').toLowerCase().includes(q);
        const matchSynonyms = (w.synonyms || []).some((s) => s.toLowerCase().includes(q));

        return matchWord || matchTrans || matchDef || matchUsage || matchFam || matchNuance || matchSynonyms;
      })
      .sort((a, b) => {
        // If query exists, prioritize exact word startsWith match
        if (q) {
          const aStarts = a.word.toLowerCase().startsWith(q);
          const bStarts = b.word.toLowerCase().startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
        }
        return a.word.localeCompare(b.word);
      });
  }, [words, query, selectedFamilyFilter, statusFilter]);

  // Handle keyboard navigation inside search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        e.preventDefault();
        onSelectWord(searchResults[selectedIndex], 'family');
      }
    }
  };

  // Pronounce audio helper
  const handlePronounce = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech synthesis not supported or blocked in iframe
    }
  };

  // Highlight matched substrings
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim() || !text) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-stone-900 rounded-xs px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-stone-400 dark:text-stone-500 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              id="global-search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search by word, Hindi translation, family, or definition..."
              className="w-full text-sm sm:text-base pl-11 pr-10 py-3 rounded-xl border border-stone-300 dark:border-stone-700 focus:border-stone-800 dark:focus:border-amber-400 focus:ring-2 focus:ring-stone-800/10 dark:focus:ring-amber-400/20 focus:outline-hidden bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-2xs font-sans"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="absolute right-3 text-[11px] font-mono text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5 bg-stone-50 dark:bg-stone-800 hidden sm:inline-block">
                ESC
              </span>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedFamilyFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                selectedFamilyFilter === 'all'
                  ? 'bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              All Families ({words.length})
            </button>
            {availableFamilies.map((fam) => {
              const famCount = words.filter((w) => w.wordFamily.toLowerCase() === fam.toLowerCase()).length;
              return (
                <button
                  key={fam}
                  onClick={() => setSelectedFamilyFilter(selectedFamilyFilter === fam ? 'all' : fam)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1 ${
                    selectedFamilyFilter === fam
                      ? 'bg-amber-800 dark:bg-amber-500 text-white dark:text-stone-950'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  <span>{fam}</span>
                  <span className="text-[10px] opacity-75">({famCount})</span>
                </button>
              );
            })}
          </div>

          {/* Status filter bar */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">Filter:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'all'
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-100 font-semibold'
                    : 'hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('learning')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'learning'
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-100 font-semibold'
                    : 'hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Learning
              </button>
              <button
                onClick={() => setStatusFilter('mastered')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  statusFilter === 'mastered'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Mastered
              </button>
            </div>

            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Showing <strong className="text-stone-800 dark:text-stone-200">{searchResults.length}</strong> words
            </span>
          </div>
        </div>

        {/* Results Scroll Area */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-stone-100 dark:divide-stone-800/80">
          {searchResults.length > 0 ? (
            searchResults.map((word, idx) => {
              const isSelected = idx === selectedIndex;
              const isExpanded = expandedWordId === word.id;

              return (
                <div
                  key={word.id}
                  onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                  className={`pt-2.5 first:pt-0 rounded-xl p-3 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-stone-400 dark:border-stone-600 bg-stone-50/80 dark:bg-stone-800/60 shadow-xs'
                      : 'border-transparent hover:border-stone-200 dark:hover:border-stone-700 hover:bg-stone-50/50 dark:hover:bg-stone-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Mastered status icon button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMastered(word.id);
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            word.mastered
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                          title={word.mastered ? 'Mastered word (click to unmark)' : 'Mark as mastered'}
                        >
                          {word.mastered ? (
                            <CheckCircle2 className="w-4 h-4 fill-emerald-100 dark:fill-emerald-950" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        {/* Headword */}
                        <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg">
                          {highlightMatch(word.word, query)}
                        </h4>

                        {/* Part of Speech */}
                        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                          {word.partOfSpeech}
                        </span>

                        {/* Audio pronounce */}
                        <button
                          type="button"
                          onClick={(e) => handlePronounce(e, word.word)}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Listen to pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Hindi translation */}
                        <span className="text-amber-800 dark:text-amber-400 font-medium text-xs sm:text-sm bg-amber-50/80 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/50">
                          {highlightMatch(word.translation, query)}
                        </span>
                      </div>

                      {/* Word Family Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 pt-0.5">
                        <span className="font-medium text-stone-600 dark:text-stone-400">Family:</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium border border-stone-200 dark:border-stone-700">
                          <Layers className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                          {highlightMatch(word.wordFamily, query)}
                        </span>
                      </div>

                      {/* Definition preview */}
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed pt-1 line-clamp-2">
                        {highlightMatch(word.definition, query)}
                      </p>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWord(word, 'family');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-2xs"
                        title="Open in Word Family view"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
                        <span className="hidden sm:inline">Go to Family</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWord(word, 'all');
                        }}
                        className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:underline px-1 py-0.5"
                        title="View in All Tokens"
                      >
                        View in Tokens
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail drawer inside search */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 space-y-2 text-xs bg-white dark:bg-stone-950 p-3 rounded-lg border border-stone-200/70 dark:border-stone-850">
                      {word.usage && (
                        <div>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">Example Usage: </span>
                          <span className="text-stone-600 dark:text-stone-300 italic">"{highlightMatch(word.usage, query)}"</span>
                        </div>
                      )}

                      {word.nuance && (
                        <div>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">Nuance & Context: </span>
                          <span className="text-stone-600 dark:text-stone-300">{highlightMatch(word.nuance, query)}</span>
                        </div>
                      )}

                      {word.synonyms && word.synonyms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">Synonyms:</span>
                          {word.synonyms.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[11px] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Empty Search State */
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">No words found matching "{query}"</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Try searching for a different English term, Hindi meaning, or semantic family.
              </p>

              {query.trim() && onAddCustomQuery && (
                <div className="pt-3">
                  <button
                    onClick={() => {
                      onAddCustomQuery(query.trim());
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-400 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
                    <span>Extract & Add "{query}" with AI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Shortcuts */}
        <div className="p-3 bg-stone-50 dark:bg-stone-950/70 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-1 py-0.5 text-[10px]">↑</kbd>
              <kbd className="font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-1 py-0.5 text-[10px]">↓</kbd>
              <span className="hidden sm:inline">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-1 py-0.5 text-[10px]">↵</kbd>
              <span className="hidden sm:inline">to jump to family</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-1 py-0.5 text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 font-medium hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
