import React, { useState } from 'react';
import { HistoryItem } from '../../../../shared/types';
import { X, Search, Clock, Trash2, Globe } from 'lucide-react';

interface HistoryModalProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  isOpen,
  onClose,
  onNavigate,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = history.filter(
    (h) =>
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="orca-modal-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="orca-modal-card max-w-xl p-6 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">History</h2>
          </div>
          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
              >
                Clear History
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="py-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] select-text"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs">No history recorded yet.</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors group"
              >
                <button
                  onClick={() => {
                    onNavigate(item.url);
                    onClose();
                  }}
                  className="flex items-center space-x-2.5 flex-1 min-w-0 text-left mr-2"
                >
                  <Globe className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{item.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{item.url}</div>
                  </div>
                </button>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
