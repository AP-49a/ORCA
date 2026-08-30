import React, { useState } from 'react';
import { MemoryStats } from '../../../../shared/types';
import {
  X,
  Waves,
  Zap,
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-orca-glass border border-slate-200 p-6 z-10 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">ORCA Memory Center</h2>
              <p className="text-xs text-slate-500 font-medium">
                Live Chromium resource tracking & tab memory management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Memory Pressure / Optimization Notice */}
        {stats.eligibleToSuspendCount > 0 && (
          <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-900">
                  {stats.eligibleToSuspendCount} inactive tab{stats.eligibleToSuspendCount > 1 ? 's' : ''} can be suspended
                </div>
                <div className="text-[11px] text-sky-700">
                  Estimated RAM recovery: <span className="font-semibold font-mono">~{stats.potentialRecoveryMB} MB</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
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
          <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Successfully suspended {optimizationResult.suspendedCount} tab{optimizationResult.suspendedCount > 1 ? 's' : ''} and released ~{optimizationResult.freedMB} MB RAM!
            </span>
          </div>
        )}

        {/* Main 3 Metrics Gauges */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {/* Browser RAM */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Browser RAM</span>
              <Cpu className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {stats.browserTotalMB} <span className="text-xs font-normal text-slate-500">MB</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Main: {stats.browserMainMB} MB &bull; Renderers: {stats.browserRenderersMB} MB
            </div>
          </div>

          {/* System Memory */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">System RAM</span>
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {stats.systemUsedPercent} <span className="text-xs font-normal text-slate-500">%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {stats.systemFreeMB} MB free of {stats.systemTotalMB} MB
            </div>
          </div>

          {/* Memory Released */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Released (Saved)</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700">
              +{stats.estimatedSavingsMB} <span className="text-xs font-normal text-emerald-600">MB</span>
            </div>
            <div className="text-[10px] text-emerald-600/80 mt-1">
              Estimated active RAM saved
            </div>
          </div>
        </div>

        {/* Ocean Tiers Hierarchy */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ocean Memory Tiers ({totalTabs} Total Tabs)
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenTabLibrary();
              }}
              className="text-xs font-medium text-sky-600 hover:underline flex items-center space-x-1"
            >
              <Layers className="w-3 h-3" />
              <span>View in Tab Library</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* SURFACE */}
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
              <div className="flex items-center space-x-1.5 mb-1 text-sky-900">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-bold">Surface</span>
              </div>
              <div className="text-lg font-bold font-mono text-sky-950">
                {stats.tabsByState.active}
              </div>
              <div className="text-[10px] text-sky-700 mt-0.5">Active in RAM</div>
            </div>

            {/* SHALLOW */}
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
              <div className="flex items-center space-x-1.5 mb-1 text-teal-900">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-xs font-bold">Shallow</span>
              </div>
              <div className="text-lg font-bold font-mono text-teal-950">
                {stats.tabsByState.idle}
              </div>
              <div className="text-[10px] text-teal-700 mt-0.5">Idle, Ready</div>
            </div>

            {/* DEEP */}
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center space-x-1.5 mb-1 text-indigo-900">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold">Deep</span>
              </div>
              <div className="text-lg font-bold font-mono text-indigo-950">
                {stats.tabsByState.suspended}
              </div>
              <div className="text-[10px] text-indigo-700 mt-0.5">RAM Released</div>
            </div>

            {/* ABYSS */}
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
              <div className="flex items-center space-x-1.5 mb-1 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="text-xs font-bold">Abyss</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {stats.tabsByState.hibernated}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">Disk Archived</div>
            </div>
          </div>
        </div>

        {/* Live Timeline History */}
        {stats.historyTimeline.length > 0 && (
          <div className="my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
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
                      className="w-full bg-sky-400 group-hover:bg-sky-600 rounded-t-sm transition-all"
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none transition-opacity z-20 whitespace-nowrap">
                      {pt.browserMB} MB
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-[11px] text-slate-400 font-medium">
            &ldquo;Your tabs can stay. Your RAM doesn&rsquo;t have to.&rdquo;
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRestoreAll}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Restore All Tabs
            </button>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {isOptimizing ? 'Optimizing...' : 'Suspend Eligible'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
