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

  return (
    <div
      id={`token-card-${token.id}`}
      className={`group relative rounded-xl border transition-all duration-200 bg-white p-5 shadow-xs hover:shadow-md ${
        token.mastered ? 'border-emerald-200 bg-emerald-50/20' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {highlightFamily && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
              <Tag className="w-3 h-3 text-stone-500" />
              {token.wordFamily}
            </span>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
            {token.partOfSpeech}
          </span>
          {token.mastered && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
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
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            id={`copy-token-btn-${token.id}`}
            onClick={handleCopy}
            title="Copy exact token format"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
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
                  ? 'text-emerald-600 hover:bg-emerald-100'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
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
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              id={`close-btn-${token.id}`}
              onClick={() => onClose(token.id)}
              title="Close token"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ml-1 border-l border-stone-200 pl-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* EXACT TOKENIZED FORMAT STRUCTURE */}
      {/* Line 1: Word (PartOfSpeech) — Translation */}
      <div className="border-l-3 border-stone-800 pl-3.5 py-0.5 mb-3 bg-stone-50/60 rounded-r-lg">
        <h3 className="text-lg font-semibold text-stone-900 flex items-baseline gap-2 flex-wrap">
          <span className="text-stone-950 font-serif tracking-tight text-xl">{token.word}</span>
          <span className="text-stone-500 font-normal text-sm">({token.partOfSpeech})</span>
          <span className="text-stone-400 font-light">—</span>
          <span className="text-amber-800 font-medium text-base font-sans">{token.translation}</span>
        </h3>
      </div>

      {/* Line 2: Definition */}
      <p className="text-stone-700 text-sm leading-relaxed mb-3 font-normal">
        {token.definition}
      </p>

      {/* Line 3: Usage sentence */}
      <div className="bg-stone-50 rounded-lg p-3 border border-stone-100 text-xs text-stone-800">
        <span className="font-semibold text-stone-900 mr-1.5">Usage:</span>
        <span className="italic text-stone-700 font-serif text-[13px]">{token.usage}</span>
      </div>

      {/* Supplementary Nuance & Synonyms */}
      {(token.nuance || (token.synonyms && token.synonyms.length > 0)) && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-2">
          {token.nuance && (
            <div>
              <button
                onClick={() => setShowNuance(!showNuance)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 transition-colors"
              >
                <Info className="w-3 h-3 text-stone-400" />
                <span>{showNuance ? 'Hide family nuance' : 'Show family nuance'}</span>
              </button>
              {showNuance && (
                <p className="mt-1.5 text-xs text-stone-600 bg-amber-50/60 border border-amber-100/80 rounded-md p-2">
                  <span className="font-semibold text-amber-900">Nuance in family: </span>
                  {token.nuance}
                </p>
              )}
            </div>
          )}

          {token.synonyms && token.synonyms.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider font-mono">Related:</span>
              {token.synonyms.map((syn, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-stone-100/70 text-stone-600 px-2 py-0.5 rounded text-[11px] border border-stone-200/50"
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
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
          <select
            value={token.wordFamily}
            onChange={(e) => {
              onMoveFamily(token.id, e.target.value);
              setIsChangingFamily(false);
            }}
            className="text-xs border border-stone-300 rounded px-2 py-1 bg-white text-stone-700"
          >
            {availableFamilies.map((fam) => (
              <option key={fam} value={fam}>
                {fam}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsChangingFamily(false)}
            className="text-xs text-stone-500 hover:text-stone-800"
          >
            Cancel
          </button>
        </div>
      ) : onMoveFamily && availableFamilies.length > 1 ? (
        <div className="mt-2 text-right">
          <button
            onClick={() => setIsChangingFamily(true)}
            className="text-[11px] text-stone-400 hover:text-stone-600 underline"
          >
            Move to another family
          </button>
        </div>
      ) : null}
    </div>
  );
};
