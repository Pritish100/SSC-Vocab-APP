import React, { useState } from 'react';
import { ViewMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  Layers,
  BookOpen,
  GraduationCap,
  Download,
  RotateCcw,
  Plus,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenSearch: () => void;
  totalWords: number;
  totalFamilies: number;
  masteredCount: number;
  onExportText: () => void;
  onResetSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenSearch,
  totalWords,
  totalFamilies,
  masteredCount,
  onExportText,
  onResetSample,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="border-b border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Stats */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-amber-400 text-amber-300 dark:text-stone-950 flex items-center justify-center shadow-xs transition-colors">
                  <BookOpen className="w-4 h-4" />
                </span>
                <h1 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Vocabulary Bank
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  Tokenized & Clustered
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 pl-10.5">
                <span>
                  <strong className="font-semibold text-stone-800 dark:text-stone-200">{totalWords}</strong> words
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-stone-800 dark:text-stone-200">{totalFamilies}</strong> word families
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-emerald-700 dark:text-emerald-400">{masteredCount}</strong> mastered
                </span>
              </div>
            </div>
          </div>

          {/* Navigation View Modes & Primary Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
            {/* Top Search Button */}
            <button
              id="header-search-btn"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200/90 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-all text-xs font-medium shadow-xs hover:border-stone-300 dark:hover:border-stone-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 group"
              title="Search words across all families (⌘K or /)"
            >
              <Search className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors" />
              <span className="hidden sm:inline">Search words...</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* View Switcher Tabs */}
            <div className="inline-flex p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700/70">
              <button
                id="view-families-tab"
                onClick={() => onViewModeChange('families')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'families'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Word Families</span>
              </button>

              <button
                id="view-all-tab"
                onClick={() => onViewModeChange('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>All Tokens</span>
              </button>

              <button
                id="view-practice-tab"
                onClick={() => onViewModeChange('practice')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'practice'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Practice Mode</span>
              </button>
            </div>

            {/* Utility Actions, Theme Switch & Primary Button */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Switch on top */}
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex items-center h-8 w-14 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-400/50 bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 select-none cursor-pointer"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="sr-only">Toggle dark mode</span>
                {/* Sun icon on the left (light indicator) */}
                <Sun
                  className={`w-3.5 h-3.5 absolute left-1.5 transition-opacity duration-200 ${
                    isDark ? 'text-stone-500 opacity-40' : 'text-amber-600 opacity-100'
                  }`}
                />
                {/* Moon icon on the right (dark indicator) */}
                <Moon
                  className={`w-3.5 h-3.5 absolute right-1.5 transition-opacity duration-200 ${
                    isDark ? 'text-amber-300 opacity-100' : 'text-stone-400 opacity-40'
                  }`}
                />
                {/* Sliding knob */}
                <span
                  className={`inline-block w-6 h-6 rounded-full bg-white dark:bg-stone-900 shadow-xs transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                    isDark ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {isDark ? (
                    <Moon className="w-3 h-3 text-amber-300" />
                  ) : (
                    <Sun className="w-3 h-3 text-amber-500" />
                  )}
                </span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
                  title="Export options"
                >
                  <Download className="w-4 h-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 py-1.5 z-50 text-xs">
                    <button
                      onClick={() => {
                        onExportText();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 font-medium"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <span>Download .TXT Tokens</span>
                    </button>
                    <button
                      onClick={() => {
                        onResetSample();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 font-medium border-t border-stone-100 dark:border-stone-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <span>Reset to Sample Bank</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Extract & Add Button */}
              <button
                id="open-extract-modal-btn"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 dark:bg-amber-400 dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-amber-300 transition-colors shadow-xs hover:shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300 dark:text-stone-950" />
                <span>Extract & Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

