import React, { useState, useRef, useMemo } from 'react';
import { WordToken, WordFamily } from '../types';
import { Sparkles, Upload, FileText, X, Check, ArrowRight, Languages, AlertCircle, RefreshCw } from 'lucide-react';
import { formatAsTokenString } from '../utils/formatters';
import { parseWordListCandidates } from '../utils/wordListParser';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWords: (newWords: Omit<WordToken, 'id' | 'createdAt'>[]) => void;
  existingFamilies: WordFamily[];
  existingWords: WordToken[];
  initialText?: string;
}

const SAMPLE_PRESETS = [
  {
    label: '👁️ Add to "Vision & Observation" family',
    description: 'Updates existing family with peer, glance, scrutinize, and behold',
    text: 'peer, glance, scrutinize, behold',
  },
  {
    label: '🔥 Add to "Provocation & Incitement" family',
    description: 'Updates existing family with incite, agitate, and inflame',
    text: 'incite, agitate, inflame, exasperate',
  },
  {
    label: '📖 Rich Paragraph / Article excerpt',
    description: 'Extracts notable vocabulary from a contextual passage',
    text: `The diplomat attempted to appease the hostile delegates, but their recalcitrant attitude only served to exacerbate the dispute. Despite his eloquent speech, several critics began to castigate his proposals, accusing him of ambiguity.`,
  },
  {
    label: '⚡ New Word Family: "Speed & Swiftness"',
    description: 'Demonstrates creating a new coherent semantic family',
    text: 'brisk, agile, fleet, expeditious',
  },
];

const LANGUAGES = [
  { code: 'Hindi', label: 'Hindi (हिन्दी) — Default' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Bengali', label: 'Bengali (বাংলা)' },
  { code: 'Marathi', label: 'Marathi (मराठी)' },
  { code: 'Tamil', label: 'Tamil (தமிழ்)' },
];

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onAddWords,
  existingFamilies,
  existingWords,
  initialText,
}) => {
  const [inputText, setInputText] = useState(initialText || '');
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewWords, setPreviewWords] = useState<Omit<WordToken, 'id' | 'createdAt'>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialText) {
        setInputText(initialText);
      }
      setPreviewWords(null);
      setError(null);
    }
  }, [isOpen, initialText]);

  // Compute detected list count if user pasted/typed a list of vocabulary words
  const detectedWordCount = useMemo(() => {
    if (!inputText.trim()) return 0;
    const candidates = parseWordListCandidates(inputText);
    return candidates.length;
  }, [inputText]);

  const existingWordSet = useMemo(() => {
    const set = new Set<string>();
    existingWords.forEach((w) => set.add(w.word.trim().toLowerCase()));
    return set;
  }, [existingWords]);

  const updateCount = useMemo(() => {
    if (!previewWords) return 0;
    return previewWords.filter((w) => existingWordSet.has(w.word.trim().toLowerCase())).length;
  }, [previewWords, existingWordSet]);

  const newCount = previewWords ? previewWords.length - updateCount : 0;

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.onerror = () => {
      setError('Could not read the uploaded file. Please try pasting the text.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!inputText.trim()) {
      setError('Please provide words or text to extract.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Pass existing families with their current words so Gemini updates existing families
      const familiesPayload = existingFamilies.map((f) => {
        const wordsInFam = existingWords
          .filter((w) => w.wordFamily.toLowerCase() === f.name.toLowerCase())
          .map((w) => w.word);
        return {
          name: f.name,
          description: f.description,
          words: wordsInFam,
        };
      });

      const response = await fetch('/api/extract-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: inputText,
          existingFamilies: familiesPayload,
          targetLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to extract words.');
      }

      if (!data.words || data.words.length === 0) {
        throw new Error('No vocabulary words could be extracted. Try providing clearer words or sentences.');
      }

      // Deduplicate extracted words by headword
      const seen = new Set<string>();
      const dedupedWords: Omit<WordToken, 'id' | 'createdAt'>[] = [];
      for (const w of (data.words || [])) {
        const key = (w.word || '').trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          dedupedWords.push(w);
        }
      }

      setPreviewWords(dedupedWords);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during extraction. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (previewWords && previewWords.length > 0) {
      onAddWords(previewWords);
      handleResetAndClose();
    }
  };

  const handleResetAndClose = () => {
    setInputText('');
    setPreviewWords(null);
    setError(null);
    setFileName(null);
    onClose();
  };

  return (
    <div
      id="input-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) handleResetAndClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 transition-all text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Extract & Tokenize Vocabulary</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Paste words, paragraphs, or upload notes. Words will be tokenized and grouped into their word families.
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Notice</p>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing}
                className="shrink-0 px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-900 dark:text-rose-200 font-semibold text-[11px] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!previewWords ? (
            <>
              {/* Input Formats Selector / Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Input Text, Words, or Passage
                  </label>
                  <div className="flex items-center gap-2">
                    <Languages className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="text-xs border border-stone-200 dark:border-stone-700 rounded-md px-2 py-1 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  id="vocab-raw-input-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={5}
                  disabled={isProcessing}
                  placeholder="Paste anything here! Examples:
• Comma separated: watch, glance, observe, peer
• Single words: scrutinize
• Numbered list: 1. provoke  2. instigate  3. agitate
• Or a full list of 100+ words, notes, or paragraphs..."
                  className="w-full text-sm p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-stone-800 dark:focus:ring-amber-400 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 font-sans leading-relaxed"
                />

                {detectedWordCount > 0 ? (
                  <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300 mt-1.5 px-1 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg py-1.5 px-2.5">
                    <span className="text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      Detected list of {detectedWordCount} vocabulary words — all {detectedWordCount} will be tokenized
                    </span>
                    <span className="text-stone-500 dark:text-stone-400">{inputText.length.toLocaleString()} chars</span>
                  </div>
                ) : inputText.trim().length > 0 ? (
                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 px-1">
                    <span>Reading passage / contextual text mode</span>
                    <span>{inputText.length.toLocaleString()} characters</span>
                  </div>
                ) : null}
              </div>

              {/* File Upload Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-stone-800 dark:border-amber-400 bg-stone-50 dark:bg-stone-800/50'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 bg-stone-50/40 dark:bg-stone-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.md,.json"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 text-stone-600 dark:text-stone-300">
                  <Upload className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  <span className="text-xs font-medium">
                    {fileName ? (
                      <span className="text-stone-900 dark:text-stone-100 font-semibold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        Uploaded: {fileName}
                      </span>
                    ) : (
                      'Drag & drop a text file (.txt, .csv, .md) or click to browse'
                    )}
                  </span>
                </div>
              </div>

              {/* Quick Sample Presets */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Or test with quick presets:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(preset.text)}
                      className="text-left p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-xs text-stone-800 dark:text-stone-200 transition-colors"
                    >
                      <span className="font-semibold block text-stone-900 dark:text-stone-100">{preset.label}</span>
                      <span className="text-stone-500 dark:text-stone-400 text-[11px] block mt-0.5">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* PREVIEW STEP */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Extracted {previewWords.length} Unique Vocabulary Words
                    </span>
                  </div>
                  {updateCount > 0 && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {newCount > 0 ? `${newCount} new words to add` : 'All words already exist'} •{' '}
                      <span className="text-blue-700 dark:text-blue-400 font-medium">{updateCount} will update existing entries</span> (no duplicate cards created)
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setPreviewWords(null)}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Edit Input
                </button>
              </div>

              <div className="space-y-3">
                {previewWords.map((word, idx) => {
                  const isExisting = existingWordSet.has(word.word.trim().toLowerCase());
                  return (
                    <div
                      key={idx}
                      className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 bg-stone-50/50 dark:bg-stone-950/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm font-serif">
                          {word.word} ({word.partOfSpeech}) — <span className="text-amber-800 dark:text-amber-400">{word.translation}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isExisting ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold">
                              Updates existing in bank
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                              New word
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium">
                            Family: {word.wordFamily}
                          </span>
                        </div>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{word.definition}</p>
                      <p className="text-stone-600 dark:text-stone-300 italic bg-white dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                        <span className="font-semibold not-italic text-stone-800 dark:text-stone-200">Usage: </span>
                        {word.usage}
                      </p>
                      {word.nuance && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="font-medium text-stone-700 dark:text-stone-300">Nuance: </span>
                          {word.nuance}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/70 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <button
            onClick={handleResetAndClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
          >
            Cancel
          </button>

          {!previewWords ? (
            <button
              id="extract-tokenize-submit-btn"
              onClick={handleExtract}
              disabled={isProcessing || !inputText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-400 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300 dark:text-stone-950" />
                  <span>
                    {detectedWordCount > 0
                      ? `Tokenizing ${detectedWordCount} Words...`
                      : 'Extracting & Tokenizing...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 dark:text-stone-950" />
                  <span>
                    {detectedWordCount > 0
                      ? `Tokenize All ${detectedWordCount} Words`
                      : 'Tokenize & Group into Families'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              id="confirm-add-words-btn"
              onClick={handleConfirmAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-400 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4 text-emerald-400 dark:text-stone-950" />
              <span>
                {updateCount > 0 && newCount > 0
                  ? `Save (${newCount} New, ${updateCount} Updates)`
                  : updateCount > 0
                  ? `Update ${updateCount} Words in Bank`
                  : `Add ${previewWords.length} Words to Bank`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
