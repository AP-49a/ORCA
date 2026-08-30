import React, { useState } from 'react';
import { BrowserSettings } from '../../../../shared/types';
import {
  X,
  Plus,
  Trash2,
  Waves,
  Settings,
  Keyboard,
  Info,
  ExternalLink,
  Shield,
  Clock,
  Sun,
  Moon,
  Monitor,
  Palette,
} from 'lucide-react';
import { OrcaLogo } from '../Icons/OrcaLogo';

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
  const [activeTab, setActiveTab] = useState<'memory' | 'general' | 'shortcuts' | 'about'>('general');
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
    <div className="orca-modal-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="orca-modal-card max-w-2xl p-6 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)]">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 py-3 border-b border-[var(--border-subtle)] flex-shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'general'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>General & Appearance</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'memory'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Memory Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'shortcuts'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'about'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Appearance / Theme Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-[var(--accent)]" />
                  <label className="text-xs font-bold text-[var(--text-primary)]">Theme & Appearance</label>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean bright ocean' },
                    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep ocean navy' },
                    { id: 'system', label: 'System', icon: Monitor, desc: 'Follows OS preference' },
                  ].map(({ id, label, icon: Icon, desc }) => {
                    const isSelected = settings.theme === id || (id === 'light' && settings.theme === 'ocean');
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onUpdateSettings({ theme: id as any })}
                        className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-xs'
                            : 'bg-[var(--surface-subtle)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)]'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                            {label}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Engine */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">Default Search Engine</label>
                <select
                  value={settings.searchEngine}
                  onChange={(e) => onUpdateSettings({ searchEngine: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="https://www.google.com/search?q=">Google</option>
                  <option value="https://duckduckgo.com/?q=">DuckDuckGo</option>
                  <option value="https://www.bing.com/search?q=">Bing</option>
                </select>
              </div>

              {/* Restore Session */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Restore Session on Startup</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Re-open all previous tabs in suspended state for instant startup without RAM lag.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.restoreSessionOnStartup}
                  onChange={(e) => onUpdateSettings({ restoreSessionOnStartup: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-6">
              {/* Auto Suspend Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Automatic Tab Suspension</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Unloads underlying Chromium resources for inactive tabs while keeping tabs open.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSuspend}
                  onChange={(e) => onUpdateSettings({ autoSuspend: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Suspend Timeout */}
              {settings.autoSuspend && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Suspend inactive tabs after:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => onUpdateSettings({ suspendTimeoutMinutes: mins })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.suspendTimeoutMinutes === mins
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {mins < 60 ? `${mins} min` : `${mins / 60} hour${mins > 60 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Hibernate Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Long-Term Tab Hibernation (Abyss)</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Moves long-inactive tabs to disk storage with zero active memory footprint.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoHibernate}
                  onChange={(e) => onUpdateSettings({ autoHibernate: e.target.checked })}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </div>

              {/* Hibernate Timeout */}
              {settings.autoHibernate && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Hibernate tabs after:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 7, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => onUpdateSettings({ hibernateTimeoutDays: days })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.hibernateTimeoutDays === days
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
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
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  Never Suspend These Sites (Domain Whitelist)
                </label>
                <form onSubmit={handleAddSuspendDomain} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. docs.google.com"
                    value={newSuspendDomain}
                    onChange={(e) => setNewSuspendDomain(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] select-text"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {settings.neverSuspendDomains.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-xs font-medium text-[var(--text-primary)]"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSuspendDomain(d)}
                        className="text-[var(--text-muted)] hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs"
                >
                  <span className="text-[var(--text-secondary)] font-medium">{s.action}</span>
                  <kbd className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded shadow-2xs font-mono font-bold text-[var(--text-primary)] text-[11px]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--surface)] shadow-md border border-[var(--border)] flex items-center justify-center">
                <OrcaLogo className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">ORCA Browser</h3>
                <p className="text-xs text-[var(--accent)] font-semibold">Version 1.0.0 (Deep Ocean Core)</p>
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                &ldquo;More tabs. Less memory.&rdquo; Designed for high performance tab management with intelligent Chromium WebContents suspension.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
