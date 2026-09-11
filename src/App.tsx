/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WordToken, WordFamily, ViewMode } from './types';
import { INITIAL_WORDS, INITIAL_FAMILIES } from './data/initialVocab';
import { Header } from './components/Header';
import { WordFamilyCard } from './components/WordFamilyCard';
import { AllWordsView } from './components/AllWordsView';
import { FlashcardMode } from './components/FlashcardMode';
import { InputModal } from './components/InputModal';
import { SearchModal } from './components/SearchModal';
import { exportWordsAsPlainText } from './utils/formatters';
import { useAuth } from './context/AuthContext';
import {
  saveWordToCloud,
  deleteWordFromCloud,
  saveUserDataToCloud,
  bulkUploadToCloud,
  subscribeToUserWords,
  subscribeToUserData,
} from './lib/cloudSync';
import { Plus, Sparkles, CheckCircle2, Layers, BookOpen, GraduationCap, RefreshCw } from 'lucide-react';

const STORAGE_KEY_WORDS = 'vocab_bank_tokens_v1';
const STORAGE_KEY_FAMILIES = 'vocab_bank_families_v1';

/**
 * Deduplicates an array of words by word headword (case-insensitive).
 * Keeps the richest definition, preserves mastered status, and keeps a single stable ID.
 */
export function deduplicateTokens(tokens: WordToken[]): WordToken[] {
  const map = new Map<string, WordToken>();
  for (const t of tokens) {
    const key = (t.word || '').trim().toLowerCase();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, t);
    } else {
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        ...t,
        id: existing.id,
        mastered: existing.mastered || t.mastered,
        createdAt: Math.max(existing.createdAt || 0, t.createdAt || 0),
        translation: t.translation || existing.translation,
        definition: t.definition || existing.definition,
        usage: t.usage || existing.usage,
        nuance: t.nuance || existing.nuance,
        synonyms: Array.from(new Set([...(existing.synonyms || []), ...(t.synonyms || [])])),
      });
    }
  }
  return Array.from(map.values());
}

export default function App() {
  const { user } = useAuth();
  const [words, setWords] = useState<WordToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORDS);
      const raw = saved ? JSON.parse(saved) : INITIAL_WORDS;
      return deduplicateTokens(raw);
    } catch {
      return deduplicateTokens(INITIAL_WORDS);
    }
  });

  const [families, setFamilies] = useState<WordFamily[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAMILIES);
      return saved ? JSON.parse(saved) : INITIAL_FAMILIES;
    } catch {
      return INITIAL_FAMILIES;
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>('families');
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [targetWordId, setTargetWordId] = useState<string | null>(null);
  const [activeTokenSearch, setActiveTokenSearch] = useState<string>('');
  const [customExtractText, setCustomExtractText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; sub?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track initial sync flag for cloud user
  const initialCloudLoadedRef = useRef(false);

  // Firestore Real-Time Synchronization when user logs in with Google
  useEffect(() => {
    if (!user) {
      initialCloudLoadedRef.current = false;
      return;
    }

    setIsSyncing(true);

    // 1. Subscribe to real-time word collection
    const unsubWords = subscribeToUserWords(
      user.uid,
      async (cloudWords) => {
        if (!initialCloudLoadedRef.current) {
          initialCloudLoadedRef.current = true;
          // First time this user signed in: If cloud is completely empty, bulk seed with current local words
          if (cloudWords.length === 0) {
            try {
              await bulkUploadToCloud(user.uid, words, families, user.email, user.displayName);
              showToast(
                `Synced ${words.length} vocabulary words to your Google Account!`,
                `You can now access your bank on your phone by logging into ${user.email}.`
              );
            } catch (err) {
              console.error('Initial bulk sync error:', err);
            } finally {
              setIsSyncing(false);
            }
            return;
          }
        }

        if (cloudWords.length > 0) {
          setWords(deduplicateTokens(cloudWords));
        }
        setIsSyncing(false);
      },
      (err) => {
        console.error('Cloud words subscription error:', err);
        setIsSyncing(false);
      }
    );

    // 2. Subscribe to user metadata (families)
    const unsubData = subscribeToUserData(
      user.uid,
      (cloudData) => {
        if (cloudData.families && cloudData.families.length > 0) {
          setFamilies(cloudData.families);
        }
      },
      (err) => {
        console.error('Cloud families subscription error:', err);
      }
    );

    return () => {
      unsubWords();
      unsubData();
    };
  }, [user?.uid]);

  // Global keyboard shortcuts for instant word search: Cmd+K, Ctrl+K, or "/"
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelectWordFromSearch = (word: WordToken, action: 'family' | 'all') => {
    setIsSearchOpen(false);
    if (action === 'family') {
      setViewMode('families');
      setTargetWordId(word.id);
      setTimeout(() => {
        const famId = `family-section-${word.wordFamily.replace(/\s+/g, '-').toLowerCase()}`;
        const el = document.getElementById(famId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      setActiveTokenSearch(word.word);
      setViewMode('all');
    }
  };

  const handleSearchAddCustomWord = (queryText: string) => {
    setCustomExtractText(queryText);
    setIsInputModalOpen(true);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(words));
    } catch (e) {
      console.error('Failed to save words to localStorage:', e);
    }
  }, [words]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(families));
    } catch (e) {
      console.error('Failed to save families to localStorage:', e);
    }
  }, [families]);

  const showToast = (text: string, sub?: string) => {
    setToastMessage({ text, sub });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Add newly extracted words & update word families dynamically without creating duplicates
  const handleAddWords = async (newRawWords: Omit<WordToken, 'id' | 'createdAt'>[]) => {
    // 1. Deduplicate incoming batch by headword
    const incomingMap = new Map<string, Omit<WordToken, 'id' | 'createdAt'>>();
    for (const w of newRawWords) {
      const key = (w.word || '').trim().toLowerCase();
      if (key && !incomingMap.has(key)) {
        incomingMap.set(key, w);
      }
    }
    const uniqueIncoming = Array.from(incomingMap.values());

    const timestamp = Date.now();
    const updatedFamilies = [...families];
    const updatedFamilyNames: string[] = [];
    const newFamilyNames: string[] = [];

    // Map existing words by lowercased headword
    const currentWords = [...words];
    const existingWordIndexMap = new Map<string, number>();
    currentWords.forEach((w, idx) => {
      existingWordIndexMap.set(w.word.trim().toLowerCase(), idx);
    });

    const newTokensToAdd: WordToken[] = [];
    const touchedWordsToSync: WordToken[] = [];
    let updatedWordCount = 0;
    let newWordCount = 0;

    uniqueIncoming.forEach((rawWord, index) => {
      const key = rawWord.word.trim().toLowerCase();

      // Canonical family name resolution (match case-insensitively)
      let canonicalFamily = rawWord.wordFamily;
      const existingFam = updatedFamilies.find(
        (f) => f.name.toLowerCase() === rawWord.wordFamily.toLowerCase()
      );

      if (existingFam) {
        canonicalFamily = existingFam.name;
        if (!updatedFamilyNames.includes(existingFam.name)) {
          updatedFamilyNames.push(existingFam.name);
        }
      } else {
        const newFam: WordFamily = {
          id: `fam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: rawWord.wordFamily,
          description: rawWord.familyDescription || `Word family covering ${rawWord.wordFamily.toLowerCase()}`,
          createdAt: Date.now(),
        };
        updatedFamilies.push(newFam);
        canonicalFamily = newFam.name;
        if (!newFamilyNames.includes(newFam.name)) {
          newFamilyNames.push(newFam.name);
        }
      }

      if (existingWordIndexMap.has(key)) {
        // Update existing word in place, keeping ID and mastered state
        const idx = existingWordIndexMap.get(key)!;
        const existing = currentWords[idx];
        const updatedEntry: WordToken = {
          ...existing,
          ...rawWord,
          wordFamily: canonicalFamily,
          id: existing.id,
          mastered: existing.mastered,
        };
        currentWords[idx] = updatedEntry;
        touchedWordsToSync.push(updatedEntry);
        updatedWordCount++;
      } else {
        // Insert as truly new word token
        const newToken: WordToken = {
          ...rawWord,
          wordFamily: canonicalFamily,
          id: `w-${timestamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: timestamp + index,
          mastered: false,
        };
        newTokensToAdd.push(newToken);
        touchedWordsToSync.push(newToken);
        newWordCount++;
      }
    });

    const finalWordList = deduplicateTokens([...newTokensToAdd, ...currentWords]);
    setFamilies(updatedFamilies);
    setWords(finalWordList);

    // Sync changes to Cloud Firestore if user is authenticated
    if (user) {
      try {
        setIsSyncing(true);
        await saveUserDataToCloud(user.uid, {
          email: user.email,
          displayName: user.displayName,
          families: updatedFamilies,
        });
        await Promise.all(touchedWordsToSync.map((w) => saveWordToCloud(user.uid, w)));
      } catch (err) {
        console.error('Failed to sync added words to cloud:', err);
      } finally {
        setIsSyncing(false);
      }
    }

    // Construct informative feedback notification
    let feedback = '';
    if (newWordCount > 0 && updatedWordCount > 0) {
      feedback = `Added ${newWordCount} new words & updated ${updatedWordCount} existing words in the bank!`;
    } else if (newWordCount > 0) {
      feedback = `Successfully added ${newWordCount} tokenized words!`;
    } else {
      feedback = `Updated ${updatedWordCount} words with refreshed definitions!`;
    }

    let sub = '';
    if (updatedFamilyNames.length > 0 && newFamilyNames.length > 0) {
      sub = `Updated existing families: ${updatedFamilyNames.join(', ')} • Created new families: ${newFamilyNames.join(', ')}`;
    } else if (updatedFamilyNames.length > 0) {
      sub = `Updated into existing families: ${updatedFamilyNames.join(', ')}`;
    } else if (newFamilyNames.length > 0) {
      sub = `Formed new word families: ${newFamilyNames.join(', ')}`;
    }
    showToast(feedback, sub);
  };

  // Quick add word directly into a specific family
  const handleQuickAddWordToFamily = async (targetFamilyName: string, wordStr: string) => {
    try {
      const response = await fetch('/api/enrich-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordStr,
          existingFamilies: families.map((f) => ({ name: f.name, description: f.description })),
          targetLanguage: 'Hindi',
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to tokenize word.');
      }

      const key = (data.word || wordStr).trim().toLowerCase();
      const existing = words.find((w) => w.word.trim().toLowerCase() === key);

      if (existing) {
        // Update existing word without creating duplicate
        const updatedEntry: WordToken = {
          ...existing,
          partOfSpeech: data.partOfSpeech || existing.partOfSpeech,
          translation: data.translation || existing.translation,
          definition: data.definition || existing.definition,
          usage: data.usage || existing.usage,
          wordFamily: targetFamilyName,
          familyDescription: data.familyDescription || existing.familyDescription,
          nuance: data.nuance || existing.nuance,
          synonyms: data.synonyms || existing.synonyms,
        };
        setWords((prev) => prev.map((w) => (w.id === existing.id ? updatedEntry : w)));
        if (user) {
          saveWordToCloud(user.uid, updatedEntry).catch(console.error);
        }
        showToast(`Updated "${existing.word}" in family "${targetFamilyName}" (no duplicate created)`);
        return;
      }

      const newToken: WordToken = {
        id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        word: data.word || wordStr,
        partOfSpeech: data.partOfSpeech || 'Word',
        translation: data.translation || '',
        definition: data.definition || '',
        usage: data.usage || '',
        wordFamily: targetFamilyName,
        familyDescription: data.familyDescription,
        nuance: data.nuance,
        synonyms: data.synonyms || [],
        createdAt: Date.now(),
        mastered: false,
      };

      setWords((prev) => deduplicateTokens([newToken, ...prev]));
      if (user) {
        saveWordToCloud(user.uid, newToken).catch(console.error);
      }
      showToast(`Added "${newToken.word}" to family "${targetFamilyName}"`);
    } catch (err: any) {
      console.error(err);
      showToast(`Could not add word: ${err.message}`);
    }
  };

  const handleDeleteToken = async (id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    if (user) {
      try {
        await deleteWordFromCloud(user.uid, id);
      } catch (err) {
        console.error('Failed to delete word from cloud:', err);
      }
    }
  };

  const handleToggleMastered = async (id: string) => {
    let toggledItem: WordToken | undefined;
    setWords((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          toggledItem = { ...w, mastered: !w.mastered };
          return toggledItem;
        }
        return w;
      })
    );
    if (user && toggledItem) {
      try {
        await saveWordToCloud(user.uid, toggledItem);
      } catch (err) {
        console.error('Failed to sync mastered state to cloud:', err);
      }
    }
  };

  const handleMoveFamily = async (id: string, newFamily: string) => {
    let movedItem: WordToken | undefined;
    setWords((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          movedItem = { ...w, wordFamily: newFamily };
          return movedItem;
        }
        return w;
      })
    );
    if (user && movedItem) {
      try {
        await saveWordToCloud(user.uid, movedItem);
      } catch (err) {
        console.error('Failed to update moved word to cloud:', err);
      }
    }
    showToast(`Word moved to "${newFamily}"`);
  };

  const handleExportText = () => {
    const textContent = exportWordsAsPlainText(words);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary_bank_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Vocabulary bank downloaded as formatted token text.');
  };

  const handleResetSample = async () => {
    if (window.confirm('Reset vocabulary bank back to sample word families?')) {
      setWords(INITIAL_WORDS);
      setFamilies(INITIAL_FAMILIES);
      if (user) {
        try {
          setIsSyncing(true);
          await bulkUploadToCloud(user.uid, INITIAL_WORDS, INITIAL_FAMILIES, user.email, user.displayName);
        } catch (err) {
          console.error('Failed to reset cloud bank:', err);
        } finally {
          setIsSyncing(false);
        }
      }
      showToast('Reset bank to sample word families.');
    }
  };

  // Group tokens for the Word Families view without duplicate families or duplicate words
  const familyMap = new Map<string, { family: WordFamily; tokens: WordToken[] }>();

  // 1. Seed with registered families
  families.forEach((fam) => {
    const key = fam.name.trim().toLowerCase();
    if (!familyMap.has(key)) {
      familyMap.set(key, { family: fam, tokens: [] });
    }
  });

  // 2. Assign deduplicated tokens to their canonical family
  words.forEach((w) => {
    const key = (w.wordFamily || 'General').trim().toLowerCase();
    let entry = familyMap.get(key);
    if (!entry) {
      const famMeta: WordFamily = {
        id: `fam-${key}`,
        name: w.wordFamily || 'General',
        description: w.familyDescription || 'Word family cluster',
        createdAt: Date.now(),
      };
      entry = { family: famMeta, tokens: [] };
      familyMap.set(key, entry);
    }
    // Prevent duplicate words inside the same family view
    if (!entry.tokens.some((existing) => existing.word.toLowerCase() === w.word.toLowerCase())) {
      entry.tokens.push(w);
    }
  });

  const groupedTokensByFamily = Array.from(familyMap.values()).filter((g) => g.tokens.length > 0);
  const allFamilyNames = Array.from(
    new Set(groupedTokensByFamily.map((g) => g.family.name))
  );

  const masteredCount = words.filter((w) => w.mastered).length;

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans antialiased selection:bg-amber-200 dark:selection:bg-amber-900/60 dark:selection:text-amber-200 transition-colors duration-200">
      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          setTargetWordId(null);
        }}
        onOpenAddModal={() => {
          setCustomExtractText('');
          setIsInputModalOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        totalWords={words.length}
        totalFamilies={groupedTokensByFamily.length}
        masteredCount={masteredCount}
        onExportText={handleExportText}
        onResetSample={handleResetSample}
        isSyncing={isSyncing}
      />

      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-md">
          <div className="bg-stone-900 dark:bg-stone-800 text-white px-4 py-3 rounded-xl shadow-xl border border-stone-800 dark:border-stone-700 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-300 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-white">{toastMessage.text}</p>
              {toastMessage.sub && (
                <p className="text-stone-300 dark:text-stone-400 mt-0.5 leading-relaxed">{toastMessage.sub}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: WORD FAMILIES (PRIMARY VIEW) */}
        {viewMode === 'families' && (
          <div className="space-y-6">
            {/* Context bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80 dark:border-stone-800">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>Semantic Word Families</span>
                  <span className="text-xs font-mono font-normal text-stone-500 dark:text-stone-400 bg-stone-200/70 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    {groupedTokensByFamily.length} Families
                  </span>
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Words sharing semantic domains (e.g. watch, see, look, observe) are kept together. Adding new words automatically merges them into existing families.
                </p>
              </div>

              <button
                onClick={() => setIsInputModalOpen(true)}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
                <span>Add More Words</span>
              </button>
            </div>

            {/* Families list */}
            {groupedTokensByFamily.length > 0 ? (
              <div className="space-y-6">
                {groupedTokensByFamily.map(({ family, tokens }) => (
                  <WordFamilyCard
                    key={family.name}
                    familyName={family.name}
                    description={family.description}
                    tokens={tokens}
                    onDeleteToken={handleDeleteToken}
                    onToggleMastered={handleToggleMastered}
                    onMoveFamily={handleMoveFamily}
                    allFamilyNames={allFamilyNames}
                    onQuickAddWordToFamily={handleQuickAddWordToFamily}
                    targetWordId={targetWordId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
                <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">Your vocabulary bank is currently empty.</p>
                <button
                  onClick={() => setIsInputModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-400 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300"
                >
                  <Plus className="w-4 h-4 text-amber-300 dark:text-stone-950" />
                  <span>Extract Your First Words</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ALL WORD TOKENS */}
        {viewMode === 'all' && (
          <AllWordsView
            words={words}
            onDeleteToken={handleDeleteToken}
            onToggleMastered={handleToggleMastered}
            onMoveFamily={handleMoveFamily}
            allFamilyNames={allFamilyNames}
            initialSearchQuery={activeTokenSearch}
          />
        )}

        {/* VIEW 3: PRACTICE / FLASHCARDS */}
        {viewMode === 'practice' && (
          <FlashcardMode
            words={words}
            onToggleMastered={handleToggleMastered}
            families={allFamilyNames}
          />
        )}
      </main>

      {/* Global Word Search Modal (Triggered by Search Button at the top, or Cmd+K / /) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        words={words}
        onSelectWord={handleSelectWordFromSearch}
        onToggleMastered={handleToggleMastered}
        onAddCustomQuery={handleSearchAddCustomWord}
      />

      {/* Input Modal for Extraction */}
      <InputModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setCustomExtractText('');
        }}
        onAddWords={handleAddWords}
        existingFamilies={families}
        existingWords={words}
        initialText={customExtractText}
      />
    </div>
  );
}
