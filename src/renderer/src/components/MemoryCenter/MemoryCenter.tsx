import React, { useState } from 'react';
import { MemoryStats } from '../../../../shared/types';
import {
  X,
  Waves,
  Zap,
  Sparkles,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  Shield,
  ShieldCheck,
  Folder,
  Moon,
  Clock,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface MemoryCenterProps {
  stats: MemoryStats;
  isOpen: boolean;
  onClose: () => void;
  onOptimizeNow: () => Promise<{ freedMB: number; suspendedCount: number } | undefined>;
  onRestoreAll: () => Promise<void>;
  onSuspendTab?: (tabId: string) => Promise<void>;
  onRestoreTab?: (tabId: string) => Promise<void>;
  onSuspendWorkspace?: (workspaceId: string) => Promise<{ freedMB: number; suspendedCount: number } | undefined>;
  onRestoreWorkspace?: (workspaceId: string) => Promise<void>;
  onOpenTabLibrary: () => void;
}

export const MemoryCenter: React.FC<MemoryCenterProps> = ({
  stats,
  isOpen,
  onClose,
  onOptimizeNow,
  onRestoreAll,
  onSuspendTab,
  onRestoreTab,
  onSuspendWorkspace,
  onRestoreWorkspace,
  onOpenTabLibrary,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{ freedMB: number; suspendedCount: number } | null>(null);
  const [activeWorkspaceAction, setActiveWorkspaceAction] = useState<string | null>(null);

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

  const handleSuspendTab = async (tabId: string) => {
    if (onSuspendTab) {
      await onSuspendTab(tabId);
    }
  };

  const handleSuspendWorkspace = async (workspaceId: string) => {
    if (!onSuspendWorkspace) return;
    setActiveWorkspaceAction(workspaceId);
    try {
      const res = await onSuspendWorkspace(workspaceId);
      if (res && res.suspendedCount > 0) {
        setOptimizationResult(res);
        setTimeout(() => setOptimizationResult(null), 4000);
      }
    } finally {
      setActiveWorkspaceAction(null);
    }
  };

  const handleRestoreWorkspace = async (workspaceId: string) => {
    if (!onRestoreWorkspace) return;
    setActiveWorkspaceAction(workspaceId);
    try {
      await onRestoreWorkspace(workspaceId);
    } finally {
      setActiveWorkspaceAction(null);
    }
  };

  const totalTabs =
    stats.tabsByState.active +
    stats.tabsByState.idle +
    stats.tabsByState.suspended +
    stats.tabsByState.hibernated;

  const formatInactiveDuration = (ms: number) => {
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  const getPressureBadge = () => {
    switch (stats.pressureLevel) {
      case 'critical':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical Pressure</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>High Pressure</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Moderate</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Optimal</span>
          </span>
        );
    }
  };

  return (
    <div className="orca-modal-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="orca-modal-card max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center border border-[var(--accent-border)]">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">ORCA Memory Center</h2>
                {getPressureBadge()}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Live Chromium resource tracking & automatic tab lifecycle management
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

        {/* Engine Status & Auto-Optimization Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                <span>Engine Status:</span>
                <span className="text-[var(--accent)] font-semibold">{stats.engineAction || 'Monitoring'}</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {stats.eligibleToSuspendCount > 0 ? (
                  <span>
                    {stats.eligibleToSuspendCount} inactive tab{stats.eligibleToSuspendCount > 1 ? 's' : ''} eligible • potential RAM recovery{' '}
                    <span className="font-semibold font-mono text-[var(--accent)]">~{stats.potentialRecoveryMB} MB</span>
                  </span>
                ) : (
                  <span>All inactive tabs managed • No memory leaks detected</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || stats.eligibleToSuspendCount === 0}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 ${
              stats.eligibleToSuspendCount > 0
                ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
            }`}
          >
            {isOptimizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Optimize Now</span>
          </button>
        </div>

        {/* Optimization Result Alert */}
        {optimizationResult && (
          <div className="my-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center space-x-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Suspended {optimizationResult.suspendedCount} tab{optimizationResult.suspendedCount > 1 ? 's' : ''} and released{' '}
              <strong className="font-mono">~{optimizationResult.freedMB} MB</strong> active RAM!
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
              <span className="text-[11px] font-semibold uppercase tracking-wider">RAM Released</span>
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

        {/* Section: Suspension Candidates */}
        {stats.suspensionCandidates && stats.suspensionCandidates.length > 0 && (
          <div className="my-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Suspension Candidates (LRU Ranked)
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                {stats.suspensionCandidates.filter((c) => !c.protected).length} ready to suspend
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {stats.suspensionCandidates.slice(0, 6).map((c) => (
                <div
                  key={c.tabId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {c.title || c.url}
                      </span>
                      {c.workspaceName && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                          {c.workspaceName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                      <span>Inactive {formatInactiveDuration(c.inactiveForMs)}</span>
                      <span>•</span>
                      <span className="font-mono">~{c.estimatedMemoryMB} MB</span>
                      {c.protected && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-medium">{c.protectionReason || 'Protected'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {c.protected ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Shield className="w-3 h-3" />
                        <span>Protected</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSuspendTab(c.tabId)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--accent-subtle)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] border border-[var(--accent-border)] text-xs font-bold transition-all shadow-xs"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Workspaces Memory Breakdown */}
        {stats.tabsByWorkspace && stats.tabsByWorkspace.length > 0 && (
          <div className="my-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Workspace Memory Distribution
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.tabsByWorkspace.map((ws) => (
                <div
                  key={ws.workspaceId}
                  className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{ws.workspaceName}</span>
                    <span className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                      ~{ws.estimatedActiveMB} MB in RAM
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)]">
                    <span>
                      {ws.activeTabs + ws.idleTabs} active
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      {ws.suspendedTabs + ws.hibernatedTabs} suspended (~{ws.estimatedSavedMB} MB saved)
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 pt-1">
                    <button
                      onClick={() => handleSuspendWorkspace(ws.workspaceId)}
                      disabled={ws.activeTabs + ws.idleTabs === 0 || activeWorkspaceAction === ws.workspaceId}
                      className="flex-1 py-1 px-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                    >
                      Suspend Inactive
                    </button>
                    <button
                      onClick={() => handleRestoreWorkspace(ws.workspaceId)}
                      disabled={ws.suspendedTabs + ws.hibernatedTabs === 0 || activeWorkspaceAction === ws.workspaceId}
                      className="flex-1 py-1 px-2 rounded-lg bg-[var(--accent-subtle)] hover:bg-[var(--accent)] hover:text-white border border-[var(--accent-border)] text-[11px] font-semibold text-[var(--accent)] transition-colors disabled:opacity-40"
                    >
                      Restore All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Timeline History */}
        {stats.historyTimeline && stats.historyTimeline.length > 0 && (
          <div className="my-5 p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Browser Memory Timeline (Live Sampling)
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Session Saved: +{stats.lifetimeFreedMB} MB • {stats.lifetimeSuspendedCount} suspensions
              </span>
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
                      className={`w-full rounded-t-sm transition-all ${
                        pt.suspensionEvent
                          ? 'bg-emerald-400 group-hover:bg-emerald-300'
                          : 'bg-[var(--accent)] group-hover:bg-[var(--accent-hover)]'
                      }`}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-xs">
                      {pt.browserMB} MB | {pt.activeTabCount ?? 0} active
                      {pt.suspensionEvent && ' (Suspension Event)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] flex-shrink-0">
          <div className="text-[11px] text-[var(--text-muted)] font-medium">
            &ldquo;More tabs. Less memory.&rdquo;
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
