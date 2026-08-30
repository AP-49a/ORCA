import React, { useState } from 'react';
import { Bookmark } from '../../../../shared/types';
import { X, Search, Star, Trash2, ExternalLink, Globe } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-orca-glass border border-slate-200 p-6 z-10 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-800">Bookmarks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No bookmarks found.</div>
          ) : (
            filtered.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <button
                  onClick={() => {
                    onNavigate(b.url);
                    onClose();
                  }}
                  className="flex items-center space-x-2.5 flex-1 min-w-0 text-left mr-2"
                >
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate">{b.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{b.url}</div>
                  </div>
                </button>
                <button
                  onClick={() => onRemoveBookmark(b.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
