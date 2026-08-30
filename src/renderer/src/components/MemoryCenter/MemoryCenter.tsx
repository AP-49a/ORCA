import React, { useState } from 'react';
import { MemoryStats } from '../../../../shared/types';
import {
  X,
  Waves,
  Zap,
  RotateCcw,
  Sparkles,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';

interface MemoryCenterProps {
  stats: MemoryStats;
  isOpen: boolean;
  onClose: () => void;
  onOptimizeNow: () => Promise<{ freedMB: number; suspendedCount: number } | undefined>;
  onRestoreAll: () => Promise<void>;
  onOpenTabLibrary: () => void;
}

export const MemoryCenter: React.FC<MemoryCenterProps> = ({
  stats,
  isOpen,
  onClose,
  onOptimizeNow,
  onRestoreAll,
  onOpenTabLibrary,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{ freedMB: number; suspendedCount: number } | null>(null);

  if (!isOpen) return null;

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await onOptimizeNow();
      if (result) {
        setOptimizationResult(result);
        setTimeout(() => setOptimizationResult(null), 5000);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const totalTabs =
    stats.tabsByState.active +
    stats.tabsByState.idle +
    stats.tabsByState.suspended +
    stats.tabsByState.hibernated;

  return (
    <div className="orca-modal-backdrop">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="orca-modal-card max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center border border-[var(--accent-border)]">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">ORCA Memory Center</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Live Chromium resource tracking & tab memory management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Memory Pressure / Optimization Notice */}
        {stats.eligibleToSuspendCount > 0 && (
          <div className="my-4 p-3.5 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-[var(--accent)] text-white shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {stats.eligibleToSuspendCount} inactive tab{stats.eligibleToSuspendCount > 1 ? 's' : ''} can be suspended
                </div>
                <div className="text-[11px] text-[var(--accent)]">
                  Estimated RAM recovery: <span className="font-semibold font-mono">~{stats.potentialRecoveryMB} MB</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isOptimizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Optimize Now</span>
            </button>
          </div>
        )}

        {/* Optimization Result Alert */}
        {optimizationResult && (
          <div className="my-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center space-x-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Successfully suspended {optimizationResult.suspendedCount} tab{optimizationResult.suspendedCount > 1 ? 's' : ''} and released ~{optimizationResult.freedMB} MB RAM!
            </span>
          </div>
        )}

        {/* Main 3 Metrics Gauges */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {/* Browser RAM */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Browser RAM</span>
              <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
              {stats.browserTotalMB} <span className="text-xs font-normal text-[var(--text-muted)]">MB</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Main: {stats.browserMainMB} MB • Renderers: {stats.browserRenderersMB} MB
            </div>
          </div>

          {/* System Memory */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">System RAM</span>
              <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
              {stats.systemUsedPercent} <span className="text-xs font-normal text-[var(--text-muted)]">%</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              {stats.systemFreeMB} MB free of {stats.systemTotalMB} MB
            </div>
          </div>

          {/* Memory Released */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between text-emerald-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Released (Saved)</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-500">
              +{stats.estimatedSavingsMB} <span className="text-xs font-normal text-emerald-400">MB</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-1">
              Estimated active RAM saved
            </div>
          </div>
        </div>

        {/* Ocean Tiers Hierarchy */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Ocean Memory Tiers ({totalTabs} Total Tabs)
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenTabLibrary();
              }}
              className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center space-x-1"
            >
              <Layers className="w-3 h-3" />
              <span>View in Tab Library</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* SURFACE */}
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30">
              <div className="flex items-center space-x-1.5 mb-1 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-bold">Surface</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {stats.tabsByState.active}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Active in RAM</div>
            </div>

            {/* SHALLOW */}
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30">
              <div className="flex items-center space-x-1.5 mb-1 text-teal-400">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-xs font-bold">Shallow</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {stats.tabsByState.idle}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Idle, Ready</div>
            </div>

            {/* DEEP */}
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
              <div className="flex items-center space-x-1.5 mb-1 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold">Deep</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {stats.tabsByState.suspended}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">RAM Released</div>
            </div>

            {/* ABYSS */}
            <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/30">
              <div className="flex items-center space-x-1.5 mb-1 text-[var(--text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-xs font-bold">Abyss</span>
              </div>
              <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                {stats.tabsByState.hibernated}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Disk Archived</div>
            </div>
          </div>
        </div>

        {/* Live Timeline History */}
        {stats.historyTimeline.length > 0 && (
          <div className="my-5 p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Browser Memory Timeline (Live Sampling)
            </div>
            <div className="flex items-end space-x-1.5 h-20 pt-2">
              {stats.historyTimeline.map((pt, i) => {
                const maxMB = Math.max(500, ...stats.historyTimeline.map((p) => p.browserMB));
                const heightPercent = Math.min(100, Math.max(15, (pt.browserMB / maxMB) * 100));
                return (
                  <div
                    key={pt.timestamp + '-' + i}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-[var(--accent)] group-hover:bg-[var(--accent-hover)] rounded-t-sm transition-all"
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-xs">
                      {pt.browserMB} MB
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-muted)] font-medium">
            &ldquo;Your tabs can stay. Your RAM doesn&rsquo;t have to.&rdquo;
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRestoreAll}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] text-xs font-semibold transition-colors"
            >
              Restore All Tabs
            </button>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-4 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-colors shadow-xs"
            >
              {isOptimizing ? 'Optimizing...' : 'Suspend Eligible'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
