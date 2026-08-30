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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-orca-glass border border-slate-200 p-6 z-10 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">History</h2>
          </div>
          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                Clear History
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="py-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No history recorded yet.</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <button
                  onClick={() => {
                    onNavigate(item.url);
                    onClose();
                  }}
                  className="flex items-center space-x-2.5 flex-1 min-w-0 text-left mr-2"
                >
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.url}</div>
                  </div>
                </button>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
