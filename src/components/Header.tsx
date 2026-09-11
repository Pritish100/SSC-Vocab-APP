import React, { useState } from 'react';
import { ViewMode } from '../types';
import { Sparkles, Layers, BookOpen, GraduationCap, Download, Copy, Check, RotateCcw, Plus } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
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
  totalWords,
  totalFamilies,
  masteredCount,
  onExportText,
  onResetSample,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <header className="border-b border-stone-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Stats */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </span>
                <h1 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                  Vocabulary Bank
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  Tokenized & Clustered
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500 pl-10.5">
                <span>
                  <strong className="font-semibold text-stone-800">{totalWords}</strong> words
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-stone-800">{totalFamilies}</strong> word families
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-emerald-700">{masteredCount}</strong> mastered
                </span>
              </div>
            </div>
          </div>

          {/* Navigation View Modes & Primary Actions */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
            {/* View Switcher Tabs */}
            <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/80">
              <button
                id="view-families-tab"
                onClick={() => onViewModeChange('families')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'families'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
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
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
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
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Practice Mode</span>
              </button>
            </div>

            {/* Utility Actions & Primary Button */}
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
                  title="Export options"
                >
                  <Download className="w-4 h-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 text-xs">
                    <button
                      onClick={() => {
                        onExportText();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Download .TXT Tokens</span>
                    </button>
                    <button
                      onClick={() => {
                        onResetSample();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium border-t border-stone-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                      <span>Reset to Sample Bank</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Primary Extract & Add Button */}
              <button
                id="open-extract-modal-btn"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-xs hover:shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Extract & Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
