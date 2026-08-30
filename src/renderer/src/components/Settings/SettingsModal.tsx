import React, { useState } from 'react';
import { BrowserSettings } from '../../../../shared/types';
import { OrcaLogo } from '../Icons/OrcaLogo';
import {
  X,
  Settings,
  Waves,
  Shield,
  Keyboard,
  Info,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  settings: BrowserSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<BrowserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'general' | 'shortcuts' | 'about'>('memory');
  const [newSuspendDomain, setNewSuspendDomain] = useState('');
  const [newHibernateDomain, setNewHibernateDomain] = useState('');

  if (!isOpen) return null;

  const handleAddSuspendDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSuspendDomain.trim()) {
      const updated = [...settings.neverSuspendDomains, newSuspendDomain.trim().toLowerCase()];
      onUpdateSettings({ neverSuspendDomains: updated });
      setNewSuspendDomain('');
    }
  };

  const handleRemoveSuspendDomain = (domain: string) => {
    const updated = settings.neverSuspendDomains.filter((d) => d !== domain);
    onUpdateSettings({ neverSuspendDomains: updated });
  };

  const handleAddHibernateDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHibernateDomain.trim()) {
      const updated = [...settings.neverHibernateDomains, newHibernateDomain.trim().toLowerCase()];
      onUpdateSettings({ neverHibernateDomains: updated });
      setNewHibernateDomain('');
    }
  };

  const handleRemoveHibernateDomain = (domain: string) => {
    const updated = settings.neverHibernateDomains.filter((d) => d !== domain);
    onUpdateSettings({ neverHibernateDomains: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-orca-glass border border-slate-200 p-6 z-10 animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 py-3 border-b border-slate-100 flex-shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'memory'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Memory Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'general'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'shortcuts'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'about'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {activeTab === 'memory' && (
            <div className="space-y-6">
              {/* Auto Suspend Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Automatic Tab Suspension</div>
                  <div className="text-[11px] text-slate-500">
                    Unloads underlying Chromium resources for inactive tabs while keeping tabs open.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSuspend}
                  onChange={(e) => onUpdateSettings({ autoSuspend: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Suspend Timeout */}
              {settings.autoSuspend && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Suspend inactive tabs after:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => onUpdateSettings({ suspendTimeoutMinutes: mins })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.suspendTimeoutMinutes === mins
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {mins < 60 ? `${mins} min` : `${mins / 60} hour${mins > 60 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Hibernate Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Long-Term Tab Hibernation (Abyss)</div>
                  <div className="text-[11px] text-slate-500">
                    Moves long-inactive tabs to disk storage with zero active memory footprint.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoHibernate}
                  onChange={(e) => onUpdateSettings({ autoHibernate: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Hibernate Timeout */}
              {settings.autoHibernate && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Hibernate tabs after:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 7, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => onUpdateSettings({ hibernateTimeoutDays: days })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.hibernateTimeoutDays === days
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {days} day{days > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Never Suspend Domains */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Never Suspend These Sites (Domain Whitelist)
                </label>
                <form onSubmit={handleAddSuspendDomain} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. docs.google.com"
                    value={newSuspendDomain}
                    onChange={(e) => setNewSuspendDomain(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-400 select-text"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {settings.neverSuspendDomains.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSuspendDomain(d)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Search Engine</label>
                <select
                  value={settings.searchEngine}
                  onChange={(e) => onUpdateSettings({ searchEngine: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                >
                  <option value="https://www.google.com/search?q=">Google</option>
                  <option value="https://duckduckgo.com/?q=">DuckDuckGo</option>
                  <option value="https://www.bing.com/search?q=">Bing</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Restore Session on Startup</div>
                  <div className="text-[11px] text-slate-500">
                    Re-open all previous tabs in suspended state for instant startup without RAM lag.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.restoreSessionOnStartup}
                  onChange={(e) => onUpdateSettings({ restoreSessionOnStartup: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              {[
                { key: 'Ctrl + T', action: 'New Tab' },
                { key: 'Ctrl + W', action: 'Close Active Tab' },
                { key: 'Ctrl + R / F5', action: 'Reload Page' },
                { key: 'Alt + Left', action: 'Go Back' },
                { key: 'Alt + Right', action: 'Go Forward' },
                { key: 'Ctrl + L', action: 'Focus Address Bar' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="text-slate-700 font-medium">{s.action}</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded shadow-2xs font-mono font-bold text-slate-800 text-[11px]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-orca-md border border-slate-100 flex items-center justify-center">
                <OrcaLogo className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">ORCA Browser</h3>
                <p className="text-xs text-sky-700 font-semibold">Version 1.0.0 (Chromium Core)</p>
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                &ldquo;More tabs. Less memory.&rdquo; Designed for high performance tab management with intelligent Chromium WebContents suspension.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
