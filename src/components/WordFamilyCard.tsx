import React, { useState, useEffect, useMemo } from 'react';
import { WordToken } from '../types';
import { TokenCard } from './TokenCard';
import { formatAsTokenString } from '../utils/formatters';
import { ChevronDown, ChevronUp, Copy, Check, Plus, Tag, Sparkles, CheckCircle2, MousePointerClick, X } from 'lucide-react';

interface WordFamilyCardProps {
  familyName: string;
  description?: string;
  tokens: WordToken[];
  onDeleteToken: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onMoveFamily: (id: string, newFamily: string) => void;
  allFamilyNames: string[];
  onQuickAddWordToFamily: (familyName: string, word: string) => Promise<void>;
  isInitiallyExpanded?: boolean;
}

export const WordFamilyCard: React.FC<WordFamilyCardProps> = ({
  familyName,
  description,
  tokens,
  onDeleteToken,
  onToggleMastered,
  onMoveFamily,
  allFamilyNames,
  onQuickAddWordToFamily,
}) => {
  // Deduplicate tokens defensively by headword
  const displayTokens = useMemo(() => {
    const map = new Map<string, WordToken>();
    for (const t of tokens) {
      const key = (t.word || '').trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, t);
      }
    }
    return Array.from(map.values());
  }, [tokens]);

  const [openWordIds, setOpenWordIds] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [quickWord, setQuickWord] = useState('');
  const [lastAddedWord, setLastAddedWord] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Auto-open newly added word in this family
  useEffect(() => {
    if (lastAddedWord) {
      const match = displayTokens.find(
        (t) => t.word.toLowerCase() === lastAddedWord.toLowerCase()
      );
      if (match && !openWordIds.includes(match.id)) {
        setOpenWordIds((prev) => [...prev, match.id]);
        setLastAddedWord(null);
      }
    }
  }, [displayTokens, lastAddedWord, openWordIds]);

  const handleCopyAll = async () => {
    try {
      const allText = displayTokens.map((t) => formatAsTokenString(t)).join('\n\n');
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggleWord = (wordId: string) => {
    setOpenWordIds((prev) => {
      if (prev.includes(wordId)) {
        return prev.filter((id) => id !== wordId);
      } else {
        return [...prev, wordId];
      }
    });
  };

  const handleOpenAll = () => {
    setOpenWordIds(displayTokens.map((t) => t.id));
  };

  const handleCloseAll = () => {
    setOpenWordIds([]);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWord.trim() || isAdding) return;
    try {
      setIsAdding(true);
      const wordToAdd = quickWord.trim();
      await onQuickAddWordToFamily(familyName, wordToAdd);
      setLastAddedWord(wordToAdd);
      setQuickWord('');
      setShowQuickAdd(false);
    } finally {
      setIsAdding(false);
    }
  };

  const masteredCount = displayTokens.filter((t) => t.mastered).length;
  const openTokens = displayTokens.filter((t) => openWordIds.includes(t.id));
  const allOpen = displayTokens.length > 0 && openTokens.length === displayTokens.length;

  return (
    <div
      id={`family-section-${familyName.replace(/\s+/g, '-').toLowerCase()}`}
      className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all duration-200 overflow-hidden mb-6"
    >
      {/* Family Header */}
      <div className="p-5 sm:p-6 bg-linear-to-b from-stone-50/70 to-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {/* Title & Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-stone-900 text-amber-300">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                {familyName}
              </h2>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {displayTokens.length} {displayTokens.length === 1 ? 'word' : 'words'}
              </span>
              {masteredCount > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {masteredCount} mastered
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-stone-600 text-sm font-normal max-w-3xl leading-relaxed">
                {description}
              </p>
            )}

            {/* Clickable Family Members List */}
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 font-mono uppercase tracking-wider font-semibold">
                    Family members:
                  </span>
                  <span className="text-[11px] text-stone-400">
                    (click word to open token)
                  </span>
                </div>

                {displayTokens.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    {allOpen ? (
                      <button
                        onClick={handleCloseAll}
                        className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                      >
                        Hide all
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenAll}
                        className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                      >
                        Open all ({displayTokens.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Word Pills / Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {displayTokens.map((token) => {
                  const isOpen = openWordIds.includes(token.id);
                  return (
                    <button
                      key={token.id}
                      id={`member-btn-${token.id}`}
                      onClick={() => handleToggleWord(token.id)}
                      title={isOpen ? `Click to hide ${token.word}` : `Click to open ${token.word} token`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none ${
                        isOpen
                          ? 'bg-stone-900 text-white shadow-xs border border-stone-900 ring-2 ring-stone-900/10'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 hover:border-stone-300'
                      }`}
                    >
                      <span className="font-serif font-semibold text-[13px]">{token.word}</span>
                      <span
                        className={`text-[10px] font-sans ${
                          isOpen ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        ({token.partOfSpeech.slice(0, 1)})
                      </span>
                      {token.mastered && (
                        <CheckCircle2
                          className={`w-3 h-3 ${
                            isOpen ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                        />
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-3 h-3 opacity-80" />
                      ) : (
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              id={`quick-add-btn-${familyName.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors border border-stone-200/80"
              title="Add a new word to this word family"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Family</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200"
              title="Copy all tokens in this family"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Tokens</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inline Quick Add Input form */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickSubmit}
            className="mt-4 pt-3 border-t border-stone-200/80 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={quickWord}
                onChange={(e) => setQuickWord(e.target.value)}
                placeholder={`Type a word to add to "${familyName}" (e.g. peer, glance, scrutinize)...`}
                disabled={isAdding}
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-800 focus:border-stone-800 text-stone-900 bg-white"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!quickWord.trim() || isAdding}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {isAdding ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Tokenizing...</span>
                </>
              ) : (
                <span>Tokenize & Add</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="px-3 py-2 rounded-lg text-xs text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Opened Tokens Area */}
      {openTokens.length > 0 ? (
        <div className="p-5 sm:p-6 bg-stone-50/50 border-t border-stone-200/70">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Opened Tokens ({openTokens.length})
            </span>
            <button
              onClick={handleCloseAll}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close all</span>
            </button>
          </div>

          <div
            className={`grid gap-4 ${
              openTokens.length === 1 ? 'grid-cols-1 max-w-3xl' : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {openTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                onDelete={onDeleteToken}
                onToggleMastered={onToggleMastered}
                onMoveFamily={onMoveFamily}
                onClose={() => handleToggleWord(token.id)}
                availableFamilies={allFamilyNames}
                highlightFamily={false}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Unopened clean hint */
        <div className="px-6 py-3.5 bg-stone-50/30 border-t border-stone-100/80 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Click any family member word above to view its token structure, definition & usage.</span>
          </div>
          {displayTokens[0] && (
            <button
              onClick={() => handleToggleWord(displayTokens[0].id)}
              className="text-stone-600 hover:text-stone-900 font-medium hover:underline text-[11px] shrink-0 ml-2"
            >
              Open "{displayTokens[0].word}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
