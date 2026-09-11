import React, { useState } from 'react';
import { WordToken } from '../types';
import { formatAsTokenString, speakWord } from '../utils/formatters';
import { Volume2, Copy, Check, Trash2, Tag, Info, CheckCircle2, X } from 'lucide-react';

interface TokenCardProps {
  token: WordToken;
  onDelete?: (id: string) => void;
  onToggleMastered?: (id: string) => void;
  onMoveFamily?: (id: string, newFamily: string) => void;
  onClose?: (id: string) => void;
  availableFamilies?: string[];
  highlightFamily?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onDelete,
  onToggleMastered,
  onMoveFamily,
  onClose,
  availableFamilies = [],
  highlightFamily = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [showNuance, setShowNuance] = useState(false);
  const [isChangingFamily, setIsChangingFamily] = useState(false);
  const [newFamilyInput, setNewFamilyInput] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleCopy = async () => {
    try {
      const text = formatAsTokenString(token);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleApplyFamilyChange = (targetFamily: string) => {
    const trimmed = targetFamily.trim();
    if (!trimmed || !onMoveFamily) return;
    onMoveFamily(token.id, trimmed);
    setIsChangingFamily(false);
    setIsCreatingNew(false);
    setNewFamilyInput('');
  };

  return (
    <div
      id={`token-card-${token.id}`}
      className={`group relative rounded-xl border transition-all duration-200 p-5 shadow-xs hover:shadow-md ${
        token.mastered
          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20'
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900/90'
      }`}
    >
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {highlightFamily && (
            <button
              type="button"
              onClick={() => onMoveFamily && setIsChangingFamily(!isChangingFamily)}
              title={onMoveFamily ? "Click to change word family" : undefined}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                onMoveFamily
                  ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 cursor-pointer'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Tag className="w-3 h-3 text-stone-500 dark:text-stone-400" />
              <span>{token.wordFamily}</span>
            </button>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/80 px-2 py-0.5 rounded border border-stone-100 dark:border-stone-700/60">
            {token.partOfSpeech}
          </span>
          {token.mastered && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Mastered
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            id={`listen-btn-${token.id}`}
            onClick={() => speakWord(token.word)}
            title="Pronounce word"
            className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            id={`copy-token-btn-${token.id}`}
            onClick={handleCopy}
            title="Copy exact token format"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Token</span>
              </>
            )}
          </button>

          {onToggleMastered && (
            <button
              id={`master-btn-${token.id}`}
              onClick={() => onToggleMastered(token.id)}
              title={token.mastered ? 'Mark unlearned' : 'Mark mastered'}
              className={`p-1.5 rounded-lg transition-colors ${
                token.mastered
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              id={`delete-btn-${token.id}`}
              onClick={() => onDelete(token.id)}
              title="Delete word"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              id={`close-btn-${token.id}`}
              onClick={() => onClose(token.id)}
              title="Close token"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-1 border-l border-stone-200 dark:border-stone-700 pl-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* EXACT TOKENIZED FORMAT STRUCTURE */}
      {/* Line 1: Word (PartOfSpeech) — Translation */}
      <div className="border-l-3 border-stone-800 dark:border-amber-400 pl-3.5 py-0.5 mb-3 bg-stone-50/60 dark:bg-stone-950/50 rounded-r-lg">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-baseline gap-2 flex-wrap">
          <span className="text-stone-950 dark:text-white font-serif tracking-tight text-xl">{token.word}</span>
          <span className="text-stone-500 dark:text-stone-400 font-normal text-sm">({token.partOfSpeech})</span>
          <span className="text-stone-400 dark:text-stone-600 font-light">—</span>
          <span className="text-amber-800 dark:text-amber-400 font-medium text-base font-sans">{token.translation}</span>
        </h3>
      </div>

      {/* Line 2: Definition */}
      <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed mb-3 font-normal">
        {token.definition}
      </p>

      {/* Line 3: Usage sentence */}
      <div className="bg-stone-50 dark:bg-stone-950/60 rounded-lg p-3 border border-stone-100 dark:border-stone-800/80 text-xs text-stone-800 dark:text-stone-200">
        <span className="font-semibold text-stone-900 dark:text-stone-100 mr-1.5">Usage:</span>
        <span className="italic text-stone-700 dark:text-stone-300 font-serif text-[13px]">{token.usage}</span>
      </div>

      {/* Supplementary Nuance & Synonyms */}
      {(token.nuance || (token.synonyms && token.synonyms.length > 0)) && (
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
          {token.nuance && (
            <div>
              <button
                onClick={() => setShowNuance(!showNuance)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              >
                <Info className="w-3 h-3 text-stone-400" />
                <span>{showNuance ? 'Hide family nuance' : 'Show family nuance'}</span>
              </button>
              {showNuance && (
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100/80 dark:border-amber-900/40 rounded-md p-2">
                  <span className="font-semibold text-amber-900 dark:text-amber-400">Nuance in family: </span>
                  {token.nuance}
                </p>
              )}
            </div>
          )}

          {token.synonyms && token.synonyms.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-mono">Related:</span>
              {token.synonyms.map((syn, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-stone-100/70 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded text-[11px] border border-stone-200/50 dark:border-stone-700/50"
                >
                  {syn}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reassign family dropdown option if requested */}
      {onMoveFamily && isChangingFamily ? (
        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 p-3 rounded-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Move &quot;{token.word}&quot; to Family:</span>
            </span>
            <button
              onClick={() => {
                setIsChangingFamily(false);
                setIsCreatingNew(false);
              }}
              className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              Cancel
            </button>
          </div>

          {!isCreatingNew ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={token.wordFamily}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreatingNew(true);
                  } else {
                    handleApplyFamilyChange(e.target.value);
                  }
                }}
                className="text-xs border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 flex-1"
              >
                <optgroup label="Existing Families">
                  {availableFamilies.map((fam) => (
                    <option key={fam} value={fam}>
                      {fam} {fam === token.wordFamily ? '(Current)' : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Custom">
                  <option value="__NEW__">+ Create New Family...</option>
                </optgroup>
              </select>

              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-white dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 whitespace-nowrap"
              >
                + New Family
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFamilyInput}
                onChange={(e) => setNewFamilyInput(e.target.value)}
                placeholder="e.g. Emotional Pacification & Temper..."
                className="text-xs border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 flex-1 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyFamilyChange(newFamilyInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleApplyFamilyChange(newFamilyInput)}
                disabled={!newFamilyInput.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950 font-semibold disabled:opacity-50"
              >
                Save &amp; Move
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 px-1"
              >
                Back
              </button>
            </div>
          )}
        </div>
      ) : onMoveFamily ? (
        <div className="mt-2.5 flex items-center justify-end">
          <button
            onClick={() => setIsChangingFamily(true)}
            className="text-[11px] text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 inline-flex items-center gap-1 transition-colors"
            title="Change this word's family"
          >
            <Tag className="w-3 h-3" />
            <span>Change family</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
