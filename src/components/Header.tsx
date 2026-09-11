import React, { useState } from 'react';
import { ViewMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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
  LogIn,
  LogOut,
  Cloud,
  Smartphone,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
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
  isSyncing?: boolean;
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
  isSyncing = false,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileControlsHidden, setIsMobileControlsHidden] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vocab_mobile_controls_hidden');
      if (saved !== null) {
        return saved === 'true';
      }
      return false;
    } catch {
      return false;
    }
  });

  const handleToggleMobileControls = () => {
    setIsMobileControlsHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vocab_mobile_controls_hidden', String(next));
      } catch {}
      return next;
    });
  };

  const { isDark, toggleTheme } = useTheme();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoginError(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setLoginError('Could not sign in with Google. Please try again.');
      }
    }
  };

  return (
    <header className="border-b border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          {/* Top Bar: Brand, Active View Tag, Cloud Status, and Mobile Toggle Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-900 dark:bg-amber-400 text-amber-300 dark:text-stone-950 flex items-center justify-center shrink-0 shadow-xs transition-colors">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight truncate">
                    Vocabulary Bank
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    Tokenized & Clustered
                  </span>

                  {/* Compact active view pill on mobile when header is collapsed */}
                  {isMobileControlsHidden && (
                    <span className="md:hidden text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
                      {viewMode === 'families' ? 'Families' : viewMode === 'all' ? 'All' : 'Practice'}
                    </span>
                  )}
                </div>

                {/* Cloud Sync Status Indicator for Desktop & when expanded */}
                <div className="hidden sm:flex items-center gap-2 mt-0.5">
                  {user ? (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      title={`Synced with Google account: ${user.email}`}
                    >
                      <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Cloud Synced</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                      title="Sign in to sync your words across your phone and laptop"
                    >
                      <Smartphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Sync to Phone</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Actions & Collapse Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Quick actions shown when mobile header is collapsed */}
              {isMobileControlsHidden && (
                <>
                  <button
                    onClick={onOpenSearch}
                    className="p-2 md:hidden rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    title="Search words"
                    aria-label="Search"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onOpenAddModal}
                    className="p-2 md:hidden rounded-xl bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-xs"
                    title="Extract & Add words"
                    aria-label="Add words"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                  </button>
                </>
              )}

              {/* Mobile Toggle Button */}
              <button
                id="mobile-header-toggle-btn"
                onClick={handleToggleMobileControls}
                className={`md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border shadow-2xs ${
                  isMobileControlsHidden
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/70'
                }`}
                aria-expanded={!isMobileControlsHidden}
                title={isMobileControlsHidden ? 'Show navigation and controls' : 'Hide panel to free up screen space'}
              >
                {isMobileControlsHidden ? (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <span>Controls</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
                    <span>Hide Panel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Panel on Mobile, Always Displayed on Desktop (md:flex) */}
          <div
            className={`${
              isMobileControlsHidden ? 'hidden' : 'flex'
            } md:flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200/60 dark:border-stone-800`}
          >
            {/* Stats line */}
            <div className="flex items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400">
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
              {isSyncing && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 animate-pulse text-[11px]">Syncing...</span>
                </>
              )}
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
                  <Sun
                    className={`w-3.5 h-3.5 absolute left-1.5 transition-opacity duration-200 ${
                      isDark ? 'text-stone-500 opacity-40' : 'text-amber-600 opacity-100'
                    }`}
                  />
                  <Moon
                    className={`w-3.5 h-3.5 absolute right-1.5 transition-opacity duration-200 ${
                      isDark ? 'text-amber-300 opacity-100' : 'text-stone-400 opacity-40'
                    }`}
                  />
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

                {/* Google Auth Button / User Profile */}
                {authLoading ? (
                  <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
                ) : user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs"
                      title={`Logged in as ${user.displayName || user.email}`}
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold font-sans">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-200 hidden sm:inline max-w-[90px] truncate">
                        {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 p-3 z-50 text-xs space-y-3">
                        <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {user.displayName || 'Google Account'}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {user.email}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
                            <Cloud className="w-3.5 h-3.5" />
                            <span>Connected • Cloud Sync Active</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                          <p className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-300">
                            <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Open on your mobile phone:</span>
                          </p>
                          <p className="text-[10px] leading-relaxed">
                            Open the same app link on your phone and log in with this Google ID. All your words will appear automatically!
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 font-medium border-t border-stone-100 dark:border-stone-800 pt-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    id="google-signin-btn"
                    onClick={handleSignIn}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 transition-colors shadow-2xs"
                    title="Sign in with Google to sync across your phone and devices"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Sign In with Google</span>
                    <span className="sm:hidden">Sign In</span>
                  </button>
                )}

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

            {/* Quick collapse bar at bottom of expanded panel on mobile */}
            <div className="md:hidden pt-2 border-t border-stone-100 dark:border-stone-800 text-center">
              <button
                onClick={handleToggleMobileControls}
                className="w-full py-1 text-center text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center gap-1 bg-stone-50/70 dark:bg-stone-800/40 rounded-lg transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide panel to see more words</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


