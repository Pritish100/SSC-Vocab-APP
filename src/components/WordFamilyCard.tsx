import React, { useState, useEffect, useMemo } from 'react';
import { WordToken } from '../types';
import { TokenCard } from './TokenCard';
import { formatAsTokenString } from '../utils/formatters';
import { ChevronDown, ChevronUp, Copy, Check, Plus, Tag, Sparkles, CheckCircle2, RefreshCw, X, MousePointerClick } from 'lucide-react';

interface WordFamilyCardProps {
  familyName: string;
  description?: string;
  tokens: WordToken[];
  onDeleteToken: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onMoveFamily: (id: string, newFamily: string) => void;
  onSplitFamily?: (familyName: string) => Promise<void>;
  allFamilyNames: string[];
  onQuickAddWordToFamily: (familyName: string, word: string) => Promise<void>;
  isInitiallyExpanded?: boolean;
  targetWordId?: string | null;
}

export const WordFamilyCard: React.FC<WordFamilyCardProps> = ({
  familyName,
  description,
  tokens,
  onDeleteToken,
  onToggleMastered,
  onMoveFamily,
  onSplitFamily,
  allFamilyNames,
  onQuickAddWordToFamily,
  targetWordId,
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
  const [isSplitting, setIsSplitting] = useState(false);

  const isBroadIntensityFamily = useMemo(() => {
    const lower = familyName.toLowerCase();
    return lower.includes('intensity') || (lower.includes('mitigat') && displayTokens.length > 10);
  }, [familyName, displayTokens.length]);

  const handleSplitClick = async () => {
    if (!onSplitFamily || isSplitting) return;
    try {
      setIsSplitting(true);
      await onSplitFamily(familyName);
    } finally {
      setIsSplitting(false);
    }
  };

  // Auto-open targeted word from search
  useEffect(() => {
    if (targetWordId) {
      const match = displayTokens.find((t) => t.id === targetWordId);
      if (match) {
        setOpenWordIds((prev) => (prev.includes(match.id) ? prev : [...prev, match.id]));
        setTimeout(() => {
          const el = document.getElementById(`token-card-${match.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [targetWordId, displayTokens]);

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
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-200 overflow-hidden mb-6"
    >
      {/* Family Header */}
      <div className="p-5 sm:p-6 bg-linear-to-b from-stone-50/70 to-white dark:from-stone-900/90 dark:to-stone-900">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {/* Title & Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-stone-900 dark:bg-amber-400 text-amber-300 dark:text-stone-950">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {familyName}
              </h2>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {displayTokens.length} {displayTokens.length === 1 ? 'word' : 'words'}
              </span>
              {masteredCount > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  {masteredCount} mastered
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-stone-600 dark:text-stone-400 text-sm font-normal max-w-3xl leading-relaxed">
                {description}
              </p>
            )}

            {/* Clickable Family Members List */}
            <div className="pt-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono uppercase tracking-wider font-semibold">
                    Family members:
                  </span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    (click word to open token)
                  </span>
                </div>

                {displayTokens.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    {allOpen ? (
                      <button
                        onClick={handleCloseAll}
                        className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 underline"
                      >
                        Hide all
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenAll}
                        className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 underline"
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
                          ? 'bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 shadow-xs border border-stone-900 dark:border-amber-400 ring-2 ring-stone-900/10 dark:ring-amber-400/20'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <span className="font-serif font-semibold text-[13px]">{token.word}</span>
                      <span
                        className={`text-[10px] font-sans ${
                          isOpen ? 'text-stone-300 dark:text-stone-900/80' : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        ({token.partOfSpeech.slice(0, 1)})
                      </span>
                      {token.mastered && (
                        <CheckCircle2
                          className={`w-3 h-3 ${
                            isOpen ? 'text-emerald-400 dark:text-emerald-950' : 'text-emerald-600 dark:text-emerald-400'
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
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {onSplitFamily && (displayTokens.length > 5 || isBroadIntensityFamily) && (
              <button
                onClick={handleSplitClick}
                disabled={isSplitting}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-2xs ${
                  isBroadIntensityFamily
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold border-amber-400'
                    : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
                title="Split this family into focused semantic clusters"
              >
                {isSplitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Splitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={`w-3.5 h-3.5 ${isBroadIntensityFamily ? 'text-stone-950' : 'text-amber-600 dark:text-amber-400'}`} />
                    <span>{isBroadIntensityFamily ? 'Split into 3 Families' : 'Split Family'}</span>
                  </>
                )}
              </button>
            )}

            <button
              id={`quick-add-btn-${familyName.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200/80 dark:border-stone-700"
              title="Add a new word to this word family"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Family</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200 dark:border-stone-700"
              title="Copy all tokens in this family"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
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

        {/* Proactive Semantic Separation Banner for Overly Broad Families */}
        {isBroadIntensityFamily && onSplitFamily && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="text-xs text-amber-950 dark:text-amber-200">
                <span className="font-bold block sm:inline mr-1">Semantic Separation Recommended:</span>
                <span>
                  This family contains {displayTokens.length} words mixing emotional feelings (placating anger/crowds) with physical severity reduction and escalation. Separate them into focused, context-specific families.
                </span>
              </div>
            </div>
            <button
              onClick={handleSplitClick}
              disabled={isSplitting}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-2xs transition-colors shrink-0 disabled:opacity-50"
            >
              {isSplitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Splitting Words...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Split into 3 Focused Families</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Inline Quick Add Input form */}
        {showQuickAdd && (
          <form
            onSubmit={handleQuickSubmit}
            className="mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={quickWord}
                onChange={(e) => setQuickWord(e.target.value)}
                placeholder={`Type a word to add to "${familyName}" (e.g. peer, glance, scrutinize)...`}
                disabled={isAdding}
                className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-stone-800 dark:focus:ring-amber-400/40 focus:border-stone-800 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-950 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!quickWord.trim() || isAdding}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-stone-900 dark:bg-amber-400 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 disabled:opacity-50 transition-colors"
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
              className="px-3 py-2 rounded-lg text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Opened Tokens Area */}
      {openTokens.length > 0 ? (
        <div className="p-5 sm:p-6 bg-stone-50/50 dark:bg-stone-950/40 border-t border-stone-200/70 dark:border-stone-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Opened Tokens ({openTokens.length})
            </span>
            <button
              onClick={handleCloseAll}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
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
              <div key={token.id} id={`token-card-${token.id}`}>
                <TokenCard
                  token={token}
                  onDelete={onDeleteToken}
                  onToggleMastered={onToggleMastered}
                  onMoveFamily={onMoveFamily}
                  onClose={() => handleToggleWord(token.id)}
                  availableFamilies={allFamilyNames}
                  highlightFamily={false}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Unopened clean hint */
        <div className="px-6 py-3.5 bg-stone-50/30 dark:bg-stone-900/30 border-t border-stone-100/80 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
            <span>Click any family member word above to view its token structure, definition & usage.</span>
          </div>
          {displayTokens[0] && (
            <button
              onClick={() => handleToggleWord(displayTokens[0].id)}
              className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 font-medium hover:underline text-[11px] shrink-0 ml-2"
            >
              Open "{displayTokens[0].word}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
