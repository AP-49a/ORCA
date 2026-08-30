import React, { useState } from 'react';
import { Bookmark } from '../../../../shared/types';
import { X, Search, Star, Trash2, Globe } from 'lucide-react';

interface BookmarksModalProps {
  bookmarks: Bookmark[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  bookmarks,
  isOpen,
  onClose,
  onNavigate,
  onRemoveBookmark,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="orca-modal-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="orca-modal-card max-w-lg p-6 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">Bookmarks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] select-text"
            />
          </div>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs">No bookmarks found.</div>
          ) : (
            filtered.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors group"
              >
                <button
                  onClick={() => {
                    onNavigate(b.url);
                    onClose();
                  }}
                  className="flex items-center space-x-2.5 flex-1 min-w-0 text-left mr-2"
                >
                  <Globe className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{b.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{b.url}</div>
                  </div>
                </button>
                <button
                  onClick={() => onRemoveBookmark(b.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
