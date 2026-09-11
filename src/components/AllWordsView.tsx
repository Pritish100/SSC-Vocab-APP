import React, { useState, useMemo } from 'react';
import { WordToken } from '../types';
import { TokenCard } from './TokenCard';
import { Search, Filter, ArrowUpDown, X, Tag } from 'lucide-react';

interface AllWordsViewProps {
  words: WordToken[];
  onDeleteToken: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onMoveFamily: (id: string, newFamily: string) => void;
  allFamilyNames: string[];
}

export const AllWordsView: React.FC<AllWordsViewProps> = ({
  words,
  onDeleteToken,
  onToggleMastered,
  onMoveFamily,
  allFamilyNames,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [selectedPos, setSelectedPos] = useState('all');
  const [filterMastered, setFilterMastered] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha' | 'family'>('recent');

  const filteredWords = useMemo(() => {
    return words
      .filter((word) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            word.word.toLowerCase().includes(q) ||
            word.translation.toLowerCase().includes(q) ||
            word.definition.toLowerCase().includes(q) ||
            word.usage.toLowerCase().includes(q) ||
            word.wordFamily.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (selectedFamily !== 'all' && word.wordFamily !== selectedFamily) {
          return false;
        }

        if (selectedPos !== 'all' && word.partOfSpeech.toLowerCase() !== selectedPos.toLowerCase()) {
          return false;
        }

        if (filterMastered === 'mastered' && !word.mastered) return false;
        if (filterMastered === 'unmastered' && word.mastered) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') return a.word.localeCompare(b.word);
        if (sortBy === 'family') return a.wordFamily.localeCompare(b.wordFamily);
        return b.createdAt - a.createdAt; // recent
      });
  }, [words, searchQuery, selectedFamily, selectedPos, filterMastered, sortBy]);

  const uniquePartsOfSpeech = useMemo(() => {
    const set = new Set(words.map((w) => w.partOfSpeech));
    return Array.from(set);
  }, [words]);

  const isFiltered = searchQuery || selectedFamily !== 'all' || selectedPos !== 'all' || filterMastered !== 'all';

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by word, Hindi translation, definition, or family..."
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-800 text-stone-900 bg-stone-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Family filter */}
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-700 focus:outline-hidden"
            >
              <option value="all">All Families</option>
              {allFamilyNames.map((fam) => (
                <option key={fam} value={fam}>
                  {fam}
                </option>
              ))}
            </select>

            {/* POS filter */}
            <select
              value={selectedPos}
              onChange={(e) => setSelectedPos(e.target.value)}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-700 focus:outline-hidden"
            >
              <option value="all">All POS</option>
              {uniquePartsOfSpeech.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-700 focus:outline-hidden"
            >
              <option value="recent">Recently Added</option>
              <option value="alpha">Alphabetical (A-Z)</option>
              <option value="family">Word Family</option>
            </select>
          </div>
        </div>

        {/* Filter chips & clear */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>
              Showing <strong className="text-stone-900">{filteredWords.length}</strong> of{' '}
              <strong className="text-stone-900">{words.length}</strong> words
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFamily('all');
                setSelectedPos('all');
                setFilterMastered('all');
              }}
              className="text-amber-800 hover:text-amber-950 font-medium underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Words Grid */}
      {filteredWords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onDelete={onDeleteToken}
              onToggleMastered={onToggleMastered}
              onMoveFamily={onMoveFamily}
              availableFamilies={allFamilyNames}
              highlightFamily={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
          <p className="text-stone-500 text-sm">No word tokens match your search criteria.</p>
        </div>
      )}
    </div>
  );
};
